function formatXML() {
    const input = document.getElementById("xmlInput").value.trim();
    const errorMessageElement = document.getElementById("errorMessage");

    // 清除错误提示
    errorMessageElement.textContent = '';

    try {
        // 直接解析XML文本
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, "application/xml");

        // 判断是否为有效的XML
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            throw new Error("无效的XML格式");
        }

        // 格式化XML并覆盖到文本框
        const formattedXml = formatXml(xmlDoc);
        document.getElementById("xmlInput").value = formattedXml;

    } catch (e) {
        // 如果格式化失败，显示错误信息
        errorMessageElement.textContent = "无法格式化为有效的XML: " + e.message;
    }
}

function formatXml(xml) {
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(xml);

    // 移除不必要的空格和换行符
    xmlString = xmlString.replace(/>\s+</g, '><');  // 去掉标签之间的空格和换行

    let formattedXml = '';
    let indent = 0;
    const lines = xmlString.split(/(?=<)|(?<=\/>)/);  // 按标签分割字符串

    // 遍历每一行进行缩进
    for (let line of lines) {
        let trimmedLine = line.trim();

        // 跳过空行
        if (!trimmedLine) continue;

        // 闭合标签，减少缩进
        if (trimmedLine.startsWith('</')) {
            indent--;
        }

        // 添加缩进和换行
        formattedXml += '  '.repeat(indent) + trimmedLine + '\n';

        // 开标签，增加缩进
        if (trimmedLine.startsWith('<') && !trimmedLine.endsWith('/>') && !trimmedLine.startsWith('</')) {
            indent++;
        }
    }

    return formattedXml.trim();
}


function compressXML() {
    const input = document.getElementById("xmlInput").value.trim();
    const errorMessageElement = document.getElementById("errorMessage");

    // 清除错误提示
    errorMessageElement.textContent = '';

    try {
        // 直接解析XML文本
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(input, "application/xml");

        // 判断是否为有效的XML
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            throw new Error("无效的XML格式");
        }

        // 压缩XML并覆盖到文本框
        const compressedXml = compressXml(xmlDoc);
        document.getElementById("xmlInput").value = compressedXml;

    } catch (e) {
        // 如果压缩失败，显示错误信息
        errorMessageElement.textContent = "无法压缩为有效的XML: " + e.message;
    }
}

function compressXml(xml) {
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(xml);

    // 移除多余的空格和换行符，转换为紧凑格式
    xmlString = xmlString.replace(/>\s+</g, '><');  // 去掉标签之间的空格和换行
    xmlString = xmlString.replace(/(\r\n|\n|\r)/gm, ''); // 移除所有换行符

    return xmlString;
}

function copyText() {
    const textArea = document.getElementById("xmlInput");
    textArea.select();
    document.execCommand('copy');
}
