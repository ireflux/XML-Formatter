// XML处理工具类
class XMLProcessor {
    static parseXML(input) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, "application/xml");
        
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            throw new Error("无效的XML格式");
        }
        
        return xmlDoc;
    }

    static formatXML(xml) {
        // 首先验证XML是否有效
        this.parseXML(xml);
        
        // 预处理：移除所有换行和多余空格
        xml = xml.replace(/\s+/g, ' ').trim();
        
        // 将XML分割成标签和文本
        const parts = xml.split(/(<[^>]+>)/);
        let formattedXml = '';
        let indent = 0;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part) continue;
            
            // 处理开始标签
            if (part.startsWith('<') && !part.startsWith('</') && !part.endsWith('/>')) {
                formattedXml += '\n' + '  '.repeat(indent) + part;
                indent++;
            }
            // 处理结束标签
            else if (part.startsWith('</')) {
                indent--;
                formattedXml += '\n' + '  '.repeat(indent) + part;
            }
            // 处理自闭合标签
            else if (part.endsWith('/>')) {
                formattedXml += '\n' + '  '.repeat(indent) + part;
            }
            // 处理文本内容
            else {
                formattedXml += part;
            }
        }
        
        return formattedXml.trim();
    }

    static compressXML(xml) {
        // 首先验证XML是否有效
        this.parseXML(xml);
        
        return xml
            .replace(/>\s+</g, '><')  // 移除标签之间的空白
            .replace(/\s+/g, ' ')     // 将多个空白字符替换为单个空格
            .replace(/>\s+([^<])/g, '>$1')  // 移除标签后的空白
            .replace(/([^>])\s+</g, '$1<')  // 移除标签前的空白
            .trim();
    }
}

// UI控制器类
class UIController {
    constructor() {
        this.xmlInput = document.getElementById("xmlInput");
        this.errorMessage = document.getElementById("errorMessage");
        this.toast = document.getElementById("toast");
        this.toastTimeout = null;
    }

    showError(message) {
        this.errorMessage.textContent = message;
    }

    clearError() {
        this.errorMessage.textContent = '';
    }

    getInputValue() {
        return this.xmlInput.value.trim();
    }

    setInputValue(value) {
        this.xmlInput.value = value;
    }

    showToast(message, duration = 2000) {
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
            this.toast.classList.remove('show');
        }

        this.toast.textContent = message;
        
        requestAnimationFrame(() => {
            this.toast.classList.add('show');
        });

        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('show');
            this.toastTimeout = null;
        }, duration);
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.xmlInput.value);
            this.showToast('复制成功！');
        } catch (err) {
            this.showError("复制失败: " + err.message);
        }
    }
}

// 初始化UI控制器
const ui = new UIController();

// 事件处理函数
function formatXML() {
    ui.clearError();
    
    try {
        const input = ui.getInputValue();
        const formattedXml = XMLProcessor.formatXML(input);
        ui.setInputValue(formattedXml);
    } catch (e) {
        ui.showError("无法格式化为有效的XML: " + e.message);
    }
}

function compressXML() {
    ui.clearError();
    
    try {
        const input = ui.getInputValue();
        const compressedXml = XMLProcessor.compressXML(input);
        ui.setInputValue(compressedXml);
    } catch (e) {
        ui.showError("无法压缩为有效的XML: " + e.message);
    }
}

function copyText() {
    ui.copyToClipboard();
}
