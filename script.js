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

    // 支持多种XML声明（包括DOCTYPE、注释等）
    static extractDeclarations(xml) {
        let decls = '';
        let rest = xml;
        // 匹配<?xml ...?>
        const xmlDecl = rest.match(/^<\?xml[\s\S]*?\?>/i);
        if (xmlDecl) {
            decls += xmlDecl[0] + '\n';
            rest = rest.replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
        }
        // 匹配<!DOCTYPE ...>
        const doctypeDecl = rest.match(/^<!DOCTYPE[\s\S]*?>/i);
        if (doctypeDecl) {
            decls += doctypeDecl[0] + '\n';
            rest = rest.replace(/^<!DOCTYPE[\s\S]*?>\s*/i, '');
        }
        // 匹配开头注释
        const commentDecl = rest.match(/^<!--([\s\S]*?)-->/);
        if (commentDecl) {
            decls += commentDecl[0] + '\n';
            rest = rest.replace(/^<!--([\s\S]*?)-->\s*/, '');
        }
        return { decls: decls.trim(), rest: rest };
    }

    static formatXML(xml) {
        // 提取声明
        const { decls, rest } = XMLProcessor.extractDeclarations(xml);
        // 验证XML
        const xmlDoc = XMLProcessor.parseXML(rest);
        function formatNode(node, indent = 0) {
            let xmlStr = '';
            const indentStr = '    '.repeat(indent); // 4个空格
            if (node.nodeType === 1) { // 元素节点
                xmlStr += `\n${indentStr}<${node.nodeName}`;
                for (let attr of node.attributes) {
                    xmlStr += ` ${attr.name}="${attr.value}"`;
                }
                xmlStr += '>';
                const children = Array.from(node.childNodes).filter(n => n.nodeType !== 3 || n.nodeValue.trim() !== '');
                if (children.length === 1 && children[0].nodeType === 3) {
                    xmlStr += children[0].nodeValue + `</${node.nodeName}>`;
                } else if (children.length > 0) {
                    for (let child of children) {
                        xmlStr += formatNode(child, indent + 1);
                    }
                    xmlStr += `\n${indentStr}</${node.nodeName}>`;
                } else {
                    xmlStr += `</${node.nodeName}>`;
                }
            } else if (node.nodeType === 3) {
                xmlStr += node.nodeValue.trim();
            }
            return xmlStr;
        }
        let result = '';
        for (let node of xmlDoc.childNodes) {
            if (node.nodeType === 1) {
                result += formatNode(node, 0);
            }
        }
        result = result.trim();
        if (decls) {
            result = decls + '\n' + result;
        }
        return result;
    }

    static compressXML(xml) {
        // 提取声明
        const { decls, rest } = XMLProcessor.extractDeclarations(xml);
        XMLProcessor.parseXML(rest);
        let compressed = rest
            .replace(/>\s+</g, '><')
            .replace(/\s+/g, ' ')
            .replace(/>\s+([^<])/g, '>$1')
            .replace(/([^>])\s+</g, '$1<')
            .trim();
        if (decls) {
            compressed = decls + '\n' + compressed;
        }
        return compressed;
    }
}

// UI控制器类
class UIController {
    constructor() {
        this.xmlInput = document.getElementById("xmlInput");
        this.errorMessage = document.getElementById("errorMessage");
        this.toast = document.getElementById("toast");
        this.toastTimeout = null;
        this.lastInputHeight = this.xmlInput.scrollHeight;
        this.debounceTimers = {};
        this.initAutoResize();
    }

    showError(message) {
        // 兼容旧逻辑，toast优先
        this.showToast(message, 2500, true);
    }

    showToast(message, duration = 2000, isError = false) {
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
            this.toast.classList.remove('show');
        }
        this.toast.textContent = message;
        this.toast.style.backgroundColor = isError ? 'var(--error-color)' : 'var(--success-color)';
        this.toast.style.opacity = '0';
        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.style.opacity = '1';
        }, 10);
        this.toastTimeout = setTimeout(() => {
            this.toast.style.opacity = '0';
            setTimeout(() => {
                this.toast.classList.remove('show');
                this.toastTimeout = null;
            }, 300);
        }, duration);
    }

    debounce(fn, key = 'default', delay = 300) {
        return (...args) => {
            if (this.debounceTimers[key]) clearTimeout(this.debounceTimers[key]);
            this.debounceTimers[key] = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    getInputValue() {
        return this.xmlInput.value;
    }

    setInputValue(value, keepCursor = false) {
        if (keepCursor) {
            const start = this.xmlInput.selectionStart;
            const end = this.xmlInput.selectionEnd;
            this.xmlInput.value = value;
            this.autoResize();
            // 尽量恢复光标位置
            this.xmlInput.setSelectionRange(start, end);
        } else {
            this.xmlInput.value = value;
            this.autoResize();
        }
    }

    // textarea自适应高度
    autoResize() {
        this.xmlInput.style.height = 'auto';
        this.xmlInput.style.height = this.xmlInput.scrollHeight + 'px';
    }
    initAutoResize() {
        this.autoResize();
        this.xmlInput.addEventListener('input', () => this.autoResize());
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.xmlInput.value);
            this.showToast('复制成功！');
        } catch (err) {
            this.showToast("复制失败: " + err.message, 2500, true);
        }
    }

    // 通用异常处理
    handleActionWithError(action, keepCursor = false) {
        try {
            const input = this.getInputValue();
            if (!input.trim()) {
                this.showToast('请输入XML内容', 2000, true);
                return;
            }
            // 大文件性能优化：超10万字符时提示
            if (input.length > 100000) {
                this.showToast('XML内容过大，操作可能较慢...', 3000, true);
            }
            const result = action(input);
            this.setInputValue(result, keepCursor);
        } catch (e) {
            this.showToast(e.message || '操作失败', 2500, true);
        }
    }
}

// 初始化UI控制器
const ui = new UIController();

// 事件处理函数
function formatXML() {
    ui.handleActionWithError(XMLProcessor.formatXML, true);
}

function compressXML() {
    ui.handleActionWithError(XMLProcessor.compressXML, true);
}

function copyText() {
    ui.copyToClipboard();
}

// 按钮防抖
const formatBtn = document.getElementById('formatBtn');
const compressBtn = document.getElementById('compressBtn');
const copyBtn = document.getElementById('copyBtn');
if (formatBtn) formatBtn.onclick = ui.debounce(formatXML, 'format', 400);
if (compressBtn) compressBtn.onclick = ui.debounce(compressXML, 'compress', 400);
if (copyBtn) copyBtn.onclick = ui.debounce(copyText, 'copy', 400);
