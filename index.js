const vscode = acquireVsCodeApi()
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('button')
    btn.addEventListener('click', () => {
        const inputs = document.getElementsByTagName('input')
        vscode.postMessage({
            text: [
                inputs[0].value,
                inputs[1].value,
                inputs[2].value,
                inputs[3].value
            ]
        })
    })
})