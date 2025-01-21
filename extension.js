function activate(_) {
    const vscode = require('vscode')
    const fs = require('fs')
    const path = require('path')
    const qtkitdir = vscode.workspace.getConfiguration().get('qtconfig.qtkitdir')
    const vskitdir = vscode.workspace.getConfiguration().get('qtconfig.vskitdir')
    if (qtkitdir === undefined || qtkitdir.trim().length === 0) {
        vscode.window.showInformationMessage('Qtconfig:Qtkitdir未设置')
    } else if (vskitdir === undefined || vskitdir.trim().length === 0) {
        vscode.window.showInformationMessage('Qtconfig:Vskitdir未设置')
    } else {
        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
        const files = fs.readdirSync(workspaceFolder)
        let basename
        files.forEach(item => {
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
            fs.writeFileSync(debugFilePath, '@echo off\nset QT_DIR=' + qtkitdir.replaceAll('/', '\\') + '\nset SRC_DIR=%cd%\nset BUILD_DIR=%cd%\\build\nif not exist %QT_DIR% exit\nif not exist %SRC_DIR% exit\nif not exist %BUILD_DIR% md %BUILD_DIR%\ncd build\ncall "' + vskitdir + '\\BuildTools\\VC\\Auxiliary\\Build\\vcvarsall.bat" x64\n%QT_DIR%\\bin\\qmake.exe %SRC_DIR%\\demo.pro -spec win32-msvc  "CONFIG+=debug" "CONFIG+=console"\nif exist %BUILD_DIR%\\debug\\' + basename + '.exe del %BUILD_DIR%\\debug\\demo.exe\nnmake Debug\nif not exist %BUILD_DIR%\\debug\\Qt5Cored.dll (\n  %QT_DIR%\\bin\\windeployqt.exe %BUILD_DIR%\\debug\\demo.exe)')
        const releaseFilePath = `${workspaceFolder}/scripts/build_release.bat`
        if (!fs.existsSync(releaseFilePath))
            fs.writeFileSync(releaseFilePath, '@echo off\nset QT_DIR=' + qtkitdir.replaceAll('/', '\\') + '\nset SRC_DIR=%cd%\nset BUILD_DIR=%cd%\\build\nif not exist %QT_DIR% exit\nif not exist %SRC_DIR% exit\nif not exist %BUILD_DIR% md %BUILD_DIR%\ncd build\ncall "' + vskitdir + '\\BuildTools\\VC\\Auxiliary\\Build\\vcvarsall.bat" x64\n%QT_DIR%\bin\qmake.exe %SRC_DIR%\demo.pro -spec win32-msvc  "CONFIG+=release"\nif exist %BUILD_DIR%\\release\\demo.exe del %BUILD_DIR%\\release\\' + basename + '.exe\nnmake Release\nif not exist %BUILD_DIR%\\release\\Qt5Core.dll (\n  %QT_DIR%\\bin\\windeployqt.exe %BUILD_DIR%\\release\\demo.exe\n)')
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
