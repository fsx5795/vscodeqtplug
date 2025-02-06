const vscode = acquireVsCodeApi()
document.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ command: 'initfinished' })
    const btn = document.querySelector('div').getElementsByTagName('button')
    const inputs = document.querySelector('div').getElementsByTagName('input')
    btn.addEventListener('click', () => {
        vscode.postMessage({
            command: 'text',
            text: [
                inputs[0].value,
                inputs[1].value,
                inputs[2].value,
                inputs[3].value
            ]
        })
    })
})
window.addEventListener('message', event => {
    const inputs = document.querySelector('div').getElementsByTagName('input')
    const message = event.data
    if (message.command === 'text') {
        inputs[0].value = message.text[0]
        inputs[1].value = message.text[1]
        inputs[2].value = message.text[2]
        inputs[3].value = message.text[3]
    } else {
        const dialog = document.querySelector('dialog')
        const btn = dialog.querySelector('button')
        btn.addEventListener('click', () => {
            dialog.hidden = true
        })
        dialog.show()
    }
})