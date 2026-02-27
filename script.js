class XMLProcessor {
    static normalizeInput(xml) {
        return xml
            .replace(/^\uFEFF/, "")
            .replace(/^\s+/, "");
    }

    static parseXML(input) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, "application/xml");
        const parseError = xmlDoc.getElementsByTagName("parsererror");

        if (parseError.length > 0) {
            throw new Error("XML 格式无效");
        }

        return xmlDoc;
    }

    static extractDeclarations(xml) {
        let declarations = "";
        let content = XMLProcessor.normalizeInput(xml);

        const xmlDecl = content.match(/^<\?xml[\s\S]*?\?>/i);
        if (xmlDecl) {
            declarations += `${xmlDecl[0]}\n`;
            content = content.replace(/^<\?xml[\s\S]*?\?>\s*/i, "");
        }

        const doctypeDecl = content.match(/^<!DOCTYPE[\s\S]*?>/i);
        if (doctypeDecl) {
            declarations += `${doctypeDecl[0]}\n`;
            content = content.replace(/^<!DOCTYPE[\s\S]*?>\s*/i, "");
        }

        const commentDecl = content.match(/^<!--([\s\S]*?)-->/);
        if (commentDecl) {
            declarations += `${commentDecl[0]}\n`;
            content = content.replace(/^<!--([\s\S]*?)-->\s*/, "");
        }

        return {
            declarations: declarations.trim(),
            content
        };
    }

    static formatXML(xml) {
        const { declarations, content } = XMLProcessor.extractDeclarations(xml);
        const xmlDoc = XMLProcessor.parseXML(content);

        function formatNode(node, indent = 0) {
            let output = "";
            const indentText = "    ".repeat(indent);

            if (node.nodeType === Node.ELEMENT_NODE) {
                output += `\n${indentText}<${node.nodeName}`;

                for (const attr of node.attributes) {
                    output += ` ${attr.name}="${attr.value}"`;
                }

                output += ">";

                const children = Array.from(node.childNodes).filter(
                    child => child.nodeType !== Node.TEXT_NODE || child.nodeValue.trim() !== ""
                );

                if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
                    output += `${children[0].nodeValue}</${node.nodeName}>`;
                } else if (children.length > 0) {
                    for (const child of children) {
                        output += formatNode(child, indent + 1);
                    }
                    output += `\n${indentText}</${node.nodeName}>`;
                } else {
                    output += `</${node.nodeName}>`;
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                output += node.nodeValue.trim();
            }

            return output;
        }

        let result = "";
        for (const node of xmlDoc.childNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                result += formatNode(node, 0);
            }
        }

        result = result.trim();
        return declarations ? `${declarations}\n${result}` : result;
    }

    static compressXML(xml) {
        const { declarations, content } = XMLProcessor.extractDeclarations(xml);
        XMLProcessor.parseXML(content);

        let compressed = content
            .replace(/>\s+</g, "><")
            .replace(/\s+/g, " ")
            .replace(/>\s+([^<])/g, ">$1")
            .replace(/([^>])\s+</g, "$1<")
            .trim();

        return declarations ? `${declarations}\n${compressed}` : compressed;
    }
}

class UIController {
    constructor() {
        this.THEME_KEY = "xml_formatter_theme";
        this.SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
    <book id="bk101" lang="en">
        <author>Gambardella, Matthew</author>
        <title>XML Developer's Guide</title>
        <genre>Computer</genre>
        <price currency="USD">44.95</price>
        <publish_date>2000-10-01</publish_date>
    </book>
</catalog>`;
        this.xmlInput = document.getElementById("xmlInput");
        this.errorMessage = document.getElementById("errorMessage");
        this.toast = document.getElementById("toast");
        this.charCount = document.getElementById("charCount");
        this.lineCount = document.getElementById("lineCount");
        this.editorFrame = document.querySelector(".editor-frame");
        this.emptyState = document.getElementById("emptyState");
        this.insertExampleBtn = document.getElementById("insertExampleBtn");
        this.formatBtn = document.getElementById("formatBtn");
        this.compressBtn = document.getElementById("compressBtn");
        this.copyBtn = document.getElementById("copyBtn");
        this.themeToggleBtn = document.getElementById("themeToggleBtn");
        this.toastTimer = null;
        this.debounceTimers = {};

        this.init();
    }

    init() {
        this.applyInitialTheme();
        this.updateStats();
        this.updateEmptyState();
        this.autoResize();
        this.bindEvents();
    }

    bindEvents() {
        this.xmlInput.addEventListener("input", () => {
            this.autoResize();
            this.updateStats();
            this.updateEmptyState();
            this.clearError();
        });

        this.editorFrame?.addEventListener("click", (event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("button")) {
                return;
            }
            this.xmlInput.focus();
        });

        this.formatBtn?.addEventListener("click", this.debounce(() => {
            this.runAction(XMLProcessor.formatXML, this.formatBtn, true);
        }, "format", 250));

        this.compressBtn?.addEventListener("click", this.debounce(() => {
            this.runAction(XMLProcessor.compressXML, this.compressBtn, true);
        }, "compress", 250));

        this.copyBtn?.addEventListener("click", this.debounce(() => {
            this.copyToClipboard();
        }, "copy", 250));

        this.insertExampleBtn?.addEventListener("click", () => {
            this.insertExampleXML();
        });

        this.themeToggleBtn?.addEventListener("click", () => {
            this.toggleTheme();
        });

        document.addEventListener("paste", (event) => {
            this.handleGlobalPaste(event);
        });

        document.addEventListener("keydown", (event) => {
            const ctrlOrMeta = event.ctrlKey || event.metaKey;
            if (!ctrlOrMeta || event.key !== "Enter") {
                return;
            }

            event.preventDefault();
            if (event.shiftKey) {
                this.runAction(XMLProcessor.compressXML, this.compressBtn, true);
            } else {
                this.runAction(XMLProcessor.formatXML, this.formatBtn, true);
            }
        });
    }

    debounce(fn, key, delay = 300) {
        return (...args) => {
            if (this.debounceTimers[key]) {
                clearTimeout(this.debounceTimers[key]);
            }
            this.debounceTimers[key] = setTimeout(() => fn(...args), delay);
        };
    }

    getInputValue() {
        return this.xmlInput.value;
    }

    setInputValue(value, keepCursor = false) {
        if (!keepCursor) {
            this.xmlInput.value = value;
            this.autoResize();
            this.updateStats();
            this.updateEmptyState();
            return;
        }

        const start = this.xmlInput.selectionStart;
        const end = this.xmlInput.selectionEnd;
        this.xmlInput.value = value;
        this.autoResize();
        this.updateStats();
        this.updateEmptyState();
        this.xmlInput.setSelectionRange(start, end);
    }

    autoResize() {
        this.xmlInput.style.height = "auto";
        this.xmlInput.style.height = `${this.xmlInput.scrollHeight}px`;
    }

    updateStats() {
        const value = this.getInputValue();
        const lines = value.length === 0 ? 0 : value.split(/\r\n|\r|\n/).length;

        if (this.charCount) {
            this.charCount.textContent = String(value.length);
        }

        if (this.lineCount) {
            this.lineCount.textContent = String(lines);
        }
    }

    setBusyState(isBusy, activeButton = null) {
        const buttons = [this.formatBtn, this.compressBtn, this.copyBtn].filter(Boolean);
        buttons.forEach((btn) => {
            btn.disabled = isBusy;
            btn.classList.toggle("is-loading", isBusy && btn === activeButton);
        });

        if (!activeButton) {
            return;
        }

        const label = activeButton.querySelector(".btn-label");
        if (!label) {
            return;
        }

        if (isBusy) {
            activeButton.dataset.originalText = label.textContent;
            label.textContent = "处理中...";
        } else if (activeButton.dataset.originalText) {
            label.textContent = activeButton.dataset.originalText;
            delete activeButton.dataset.originalText;
        }
    }

    applyInitialTheme() {
        const savedTheme = localStorage.getItem(this.THEME_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
            this.setTheme(savedTheme, false);
            return;
        }

        const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
        this.setTheme(prefersLight ? "light" : "dark", false);
    }

    setTheme(theme, notify = true) {
        document.documentElement.setAttribute("data-theme", theme);
        if (this.themeToggleBtn) {
            this.themeToggleBtn.setAttribute(
                "aria-label",
                theme === "dark" ? "切换到浅色主题" : "切换到深色主题"
            );
        }
        localStorage.setItem(this.THEME_KEY, theme);
        if (notify) {
            this.showToast(theme === "dark" ? "已切换为深色主题" : "已切换为浅色主题", false, 1300);
        }
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        this.setTheme(current === "dark" ? "light" : "dark");
    }

    updateEmptyState() {
        if (!this.editorFrame) {
            return;
        }
        this.editorFrame.classList.toggle("is-empty", !this.getInputValue().trim());
    }

    insertExampleXML() {
        this.setInputValue(this.SAMPLE_XML);
        this.xmlInput.focus();
        this.showToast("示例 XML 已插入", false, 1400);
    }

    handleGlobalPaste(event) {
        if (!event.clipboardData) {
            return;
        }

        const activeElement = document.activeElement;
        const isTypingTarget =
            activeElement instanceof HTMLTextAreaElement ||
            (activeElement instanceof HTMLInputElement &&
                /^(text|search|url|email|tel|password)$/i.test(activeElement.type)) ||
            (activeElement instanceof HTMLElement && activeElement.isContentEditable);

        if (isTypingTarget) {
            return;
        }

        const text = event.clipboardData.getData("text/plain");
        if (!text) {
            return;
        }

        event.preventDefault();
        this.xmlInput.focus();
        this.xmlInput.value = text;
        this.autoResize();
        this.updateStats();
        this.updateEmptyState();
        this.clearError();
        this.showToast("已粘贴剪贴板内容", false, 1200);
    }

    showToast(message, isError = false, duration = 2200) {
        if (!this.toast) {
            return;
        }

        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
            this.toast.classList.remove("show");
        }

        this.toast.textContent = message;
        this.toast.style.background = isError
            ? "linear-gradient(160deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))"
            : "linear-gradient(160deg, rgba(34, 197, 94, 0.95), rgba(21, 128, 61, 0.95))";
        this.toast.classList.add("show");

        this.toastTimer = setTimeout(() => {
            this.toast.classList.remove("show");
            this.toastTimer = null;
        }, duration);
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        this.showToast(message, true, 2600);
    }

    clearError() {
        if (this.errorMessage) {
            this.errorMessage.textContent = "";
        }
    }

    runAction(action, activeButton, keepCursor = false) {
        const input = this.getInputValue();
        if (!input.trim()) {
            this.showError("请输入 XML 内容");
            return;
        }

        if (input.length > 100000) {
            this.showToast("内容较大，处理中可能稍慢...", false, 1600);
        }

        this.clearError();
        this.setBusyState(true, activeButton);

        requestAnimationFrame(() => {
            setTimeout(() => {
                try {
                    const result = action(input);
                    this.setInputValue(result, keepCursor);
                    this.showToast("处理完成", false);
                } catch (error) {
                    this.showError(error.message || "处理失败");
                } finally {
                    this.setBusyState(false, activeButton);
                }
            }, 0);
        });
    }

    async copyToClipboard() {
        const text = this.getInputValue();
        if (!text.trim()) {
            this.showError("没有可复制的内容");
            return;
        }

        this.clearError();
        this.setBusyState(true, this.copyBtn);

        try {
            await navigator.clipboard.writeText(text);
            this.showToast("已复制到剪贴板", false);
        } catch (error) {
            this.showError(`复制失败: ${error.message || "浏览器不支持"}`);
        } finally {
            this.setBusyState(false, this.copyBtn);
        }
    }
}

const ui = new UIController();

function formatXML() {
    ui.runAction(XMLProcessor.formatXML, ui.formatBtn, true);
}

function compressXML() {
    ui.runAction(XMLProcessor.compressXML, ui.compressBtn, true);
}

function copyText() {
    ui.copyToClipboard();
}
