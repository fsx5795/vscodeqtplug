const vscode = require('vscode')
const path = require('path')
const fs = require('fs')

/**
 从某个HTML文件读取能被Webview加载的HTML内容
 @param {*} context 上下文
 @param {*} templatePath 相对于插件根目录的html文件相对路径
 @param {*} panel webview面板
*/
function getWebViewContent(context, templatePath, panel) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let htmlIndexPath = fs.readFileSync(resourcePath, 'utf-8')
    const html = htmlIndexPath.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        const absLocalPath = path.resolve(dirPath, $2)
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(absLocalPath))
        const replaceHref = $1 + webviewUri.toString() + '"'
        return replaceHref
    })
    return html
}
function generConfig(mingwpath, qtdir, qtkitdir, vcvarsall) {
    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
    const workFiles = fs.readdirSync(workspaceFolder)
    let basename
    workFiles.forEach(item => {
        if (path.extname(`${workspaceFolder}/${item}`) === '.pro') {
            basename = path.basename(`${workspaceFolder}/${item}`, '.pro')
        }
    })
    if (!fs.existsSync(`${workspaceFolder}/.vscode`))
        fs.mkdirSync(`${workspaceFolder}/.vscode`)
    const cCppPropertiesFilePath = `${workspaceFolder}/.vscode/c_cpp_properties.json`
    if (!fs.existsSync(cCppPropertiesFilePath))
        fs.writeFileSync(cCppPropertiesFilePath, '{\n    "configurations": [\n        {\n            "name": "qt",\n            "includePath": [\n                "' + qtkitdir.replaceAll('\\', '/') + '/include/**",\n                "${workspaceRoot}/**"\n            ],\n            "cStandard": "c11",\n            "cppStandard": "c++17"\n        }\n    ],\n    "version": 4\n}')
    const launchFilePath = `${workspaceFolder}/.vscode/launch.json`
    if (!fs.existsSync(launchFilePath))
        fs.writeFileSync(launchFilePath, '{\n    "version": "0.2.0",\n    "configurations": [\n        {\n            "name": "Launch",\n            "type": "cppvsdbg",\n            "request": "launch",\n            "program": "${workspaceRoot}/build/debug/' + basename + '.exe",\n            "args": [],\n            "stopAtEntry": false,\n            "cwd": "${workspaceRoot}",\n            "environment": [],\n            "console": "integratedTerminal",\n            "preLaunchTask": "debug"\n        }\n    ]\n}')
    const settingsFilePath = `${workspaceFolder}/.vscode/settings.json`
    if (!fs.existsSync(settingsFilePath))
        fs.writeFileSync(settingsFilePath, '{\n    "qtConfigure.qtKitDir": "' + qtkitdir.replaceAll('\\', '/') + '"\n}')
    const tasksFilePath = `${workspaceFolder}/.vscode/tasks.json`
    if (!fs.existsSync(tasksFilePath))
        fs.writeFileSync(tasksFilePath, '{\n    "version": "2.0.0",\n    "tasks": [\n        {\n            "label": "debug",\n            "type": "shell",\n            "command": "cmd",\n            "args": [\n                "/c",\n                "${workspaceRoot}/scripts/build_debug.bat",\n                "debug"\n            ],\n            "group": {\n                "kind": "build",\n                "isDefault": true\n            }\n        },\n        {\n            "label": "release",\n            "type": "shell",\n            "command": "cmd",\n            "args": [\n                "/c",\n                "${workspaceRoot}/scripts/build_release.bat",\n                "release"\n            ],\n            "group": {\n                "kind": "build",\n                "isDefault": true\n            }\n        }\n    ]\n}')
    if (!fs.existsSync(`${workspaceFolder}/scripts`))
        fs.mkdirSync(`${workspaceFolder}/scripts`)
    const debugFilePath = `${workspaceFolder}/scripts/build_debug.bat`
    if (!fs.existsSync(debugFilePath))
        fs.writeFileSync(debugFilePath, '@echo off\nset QT_DIR=' + qtkitdir.replaceAll('/', '\\') + '\nset SRC_DIR=%cd%\nset BUILD_DIR=%cd%\\build\nif not exist %QT_DIR% exit\nif not exist %SRC_DIR% exit\nif not exist %BUILD_DIR% md %BUILD_DIR%\ncd build\ncall "' + vcvarsall + '" x64\n%QT_DIR%\\bin\\qmake.exe %SRC_DIR%\\demo.pro -spec win32-msvc  "CONFIG+=debug" "CONFIG+=console"\nif exist %BUILD_DIR%\\debug\\' + basename + '.exe del %BUILD_DIR%\\debug\\demo.exe\nnmake Debug\nif not exist %BUILD_DIR%\\debug\\Qt5Cored.dll (\n  %QT_DIR%\\bin\\windeployqt.exe %BUILD_DIR%\\debug\\demo.exe)')
    const releaseFilePath = `${workspaceFolder}/scripts/build_release.bat`
    if (!fs.existsSync(releaseFilePath))
        fs.writeFileSync(releaseFilePath, '@echo off\nset QT_DIR=' + qtkitdir.replaceAll('/', '\\') + '\nset SRC_DIR=%cd%\nset BUILD_DIR=%cd%\\build\nif not exist %QT_DIR% exit\nif not exist %SRC_DIR% exit\nif not exist %BUILD_DIR% md %BUILD_DIR%\ncd build\ncall "' + vcvarsall + '" x64\n%QT_DIR%\bin\qmake.exe %SRC_DIR%\demo.pro -spec win32-msvc  "CONFIG+=release"\nif exist %BUILD_DIR%\\release\\demo.exe del %BUILD_DIR%\\release\\' + basename + '.exe\nnmake Release\nif not exist %BUILD_DIR%\\release\\Qt5Core.dll (\n  %QT_DIR%\\bin\\windeployqt.exe %BUILD_DIR%\\release\\demo.exe\n)')
}
function activate(context) {
    const mingwpath = vscode.workspace.getConfiguration().get('qtconfig.mingwpath')
    const qtdir = vscode.workspace.getConfiguration().get('qtconfig.qtdir')
    const qtkitdir = vscode.workspace.getConfiguration().get('qtconfig.qtkitdir')
    const vcvarsall = vscode.workspace.getConfiguration().get('qtconfig.vcvarsall')

    if (mingwpath === undefined || mingwpath.trim().length === 0
        || qtdir === undefined || qtdir.trim().length === 0
        || qtkitdir === undefined || qtkitdir.trim().length === 0
        || vcvarsall === undefined || vcvarsall.trim().length === 0) {
        // 创建webview
        const panel = vscode.window.createWebviewPanel(
            'testWebview', // viewType
            'Qt相关设置', // 视图标题
            vscode.ViewColumn.One, // 显示在编辑器的哪个部位
            {
                enableScripts: true, // 启用JS，默认禁用
                retainContextWhenHidden: true // webview被隐藏时保持状态，避免被重置
            }
        )
        panel.webview.html = getWebViewContent(context, 'index.html', panel)

        //插件收到 webview 的消息
        panel.webview.onDidReceiveMessage(message => {
            // 最后一个参数，为true时表示写入全局配置，为false或不传时则只写入工作区配置
            vscode.workspace.getConfiguration().update('qtconfig.mingwpath', message.text[0], true);
            vscode.workspace.getConfiguration().update('qtconfig.qtdir', message.text[1], true);
            vscode.workspace.getConfiguration().update('qtconfig.qtkitdir', message.text[2], true);
            vscode.workspace.getConfiguration().update('qtconfig.vcvarsall', message.text[3], true);

            let mingwIncludePath, msvcIncludePath
            const qtkitFiles = fs.readdirSync(message.text[2])
            qtkitFiles.forEach(item => {
                if (path.basename(item).startsWith('mingw'))
                    mingwIncludePath = item + '/include/**'
                else if (path.basename(item).startsWith('msvc'))
                    msvcIncludePath = item + '/include/**'
            })
            if (mingwIncludePath.length !== 0 && msvcIncludePath.length !== 0)
                panel.webview.postMessage({text: 'mingwmsvc'})
            else if (mingwIncludePath.length !== 0)
                //生成配置文件
                generConfig(mingwpath, qtdir, mingwIncludePath, vcvarsall)
            else if (msvcIncludePath.length !== 0)
                //生成配置文件
                generConfig(mingwpath, qtdir, msvcIncludePath, vcvarsall)
            //关闭 webview
            //panel.dispose()
        }, undefined, context.subscriptions)
    } else {
        generConfig(mingwpath, qtdir, qtkitdir, vcvarsall)
    }
    /*
    context.subscriptions.push(
        vscode.commands.registerCommand('validate', () => {
            vscode.window.showInformationMessage('it works')
        })
    )
    */
}
module.exports = { activate }