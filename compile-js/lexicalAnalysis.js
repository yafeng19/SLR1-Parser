
function myIsdigit(ch) {
    return ch.charCodeAt() - 48 >= 0 && ch.charCodeAt() - 48 <= 9;
}

// 词法分析第一步：源代码预处理，删除注释与空白字符
function preprocess() {

    code = document.getElementById("sourceCode").value;

    // 读取源代码
    textList = code.split("\n");
    len = textList.length;

    var after_prepocess = "";

    let i = 0
    while (i < len) {
        line = textList[i];

        // 删除编译文件，'#'之后的内容不保留
        index = line.indexOf('#');
        if (index != -1) {
            i++;
            continue;
        }


        // 删除单行注释，单行注释之后的内容不保留
        index = line.indexOf('//');
        if (index != -1) {
            // line保存//之前的句子
            line = line.slice(0, index);
            if (line.match(/^[ ]*$/)) {
                i++;
                continue;
            }
        }


        // 删除多行注释，只删除一对/*和*/之间的内容，目前不支持一行中有多对多行注释符号
        index = line.indexOf('/*');
        if (index != -1) {
            //line1保存 /*之前的句子
            line1 = line.slice(0, index);

            index = line.indexOf('*/');
            while (index == -1) {
                i++;
                line = textList[i];
                index = line.indexOf('*/');
            }
            // line2保存 */之后的句子
            index = index + 2
            line2 = line.slice(index);
            line = line1 + ' ' + line2;
            if (line.match(/^[ ]*$/)) {
                i++;
                continue;
            }

        }

        // 删除注释之后如果该行句子不空，则去除空格、tab、回车等空白字符之后，
        // 将分出来的单词用空格分隔开，按行写入页面DOM结点
        if (!line.match(/^[ ]*$/)) {
            words = line.split();
            //去除空列表
            if (words.length > 0) {
                words.forEach(word => {
                    after_prepocess += word + ' ';
                });
                after_prepocess += '</br>';
            }
        }
        i++;
    }
    // document.getElementById("afterPre").innerHTML = after_prepocess;
    return after_prepocess;

}

// 对预处理得到的文件进行进一步处理，识别关键字、运算符、界符、数字、字符串、标识符、以及错误
function process(after_preprocess) {
    // 关键字
    const keywords = [
        'char', 'double', 'enum', 'float',  // 数据类型关键字
        'int', 'long', 'short', 'signed',
        'struct', 'union', 'unsigned', 'void',
        'for', 'do', 'while', 'break', 'continue',  // 控制语句关键字
        'if', 'else', 'goto',
        'switch', 'case', 'functionault', 'return',
        'auto', 'extern', 'register', 'static',  // 存储类型关键字
        'const', 'sizeof', 'typefunction', 'volatile'  // 其他关键字
    ]
    // 运算符
    const operators = ['+', '-', '*', '/', '%', '++', '--',  // 算术运算符
        '==', '!=', '>', '<', '>=', '<=',  // 关系运算符
        '&', '|', // 按位与，按位或（也是逻辑运算符的先导符）
        '&&', '||', '!',  // 逻辑运算符
        '=', '+=', '-=', '+=', '/=', '%=',  // 赋值运算符
    ]
    // 分界符
    const delimiters = ['{', '}', '[', ']', '(', ')', ',', '.', ';']

    // 存放单词种类
    var species = []

    // 按行读取每一行文字，存放入列表中
    lines = after_preprocess.split('</br>');    // 将换行符替换成空字符

    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(/(^\s*)|(\s*$)/g, "");  // 删除句子前后空白字符
    }


    var row = 0
    while (row < lines.length) {
        line = lines[row];
        lineLength = line.length;
        var i = 0;

        while (i < lineLength) {

            // 0 - 空格：跳过空格。优先级：1
            if (line[i] == ' ') {
                i++;
                continue;
            }


            // 7 - 分界符：分界符均为单字符，记录到单词序列中。优先级：1
            if (delimiters.indexOf(line[i]) >= 0) {
                species.push(["分界符", 7, line[i]]);
                i++;
                continue;
            }


            // 8 - 运算符：分为单字符运算符和双字符运算符，解析后记录到单词序列中。优先级：1
            if (operators.indexOf(line[i]) >= 0) {
                temp = line[i];
                i++;
                // 双字符超前搜索
                if (operators.indexOf(temp + line[i]) >= 0) {
                    temp += line[i];
                    i++;
                }
                species.push(["运算符", 8, temp]);
                continue;
            }

            // 3 - 浮点数，2 - 整数。优先级：2
            if (myIsdigit(line[i])) {
                temp = "";  // 用以接收未知长度的数字
                while (myIsdigit(line[i]) || line[i] == '.') {
                    temp += line[i];
                    i++;
                    // 超过一行的字符数则退出
                    if (i > line.length - 1)
                        break;
                }

                // 防止出现数字开头的非法标识符
                if (i == line.length || myIsdigit(line[i]) || operators.indexOf(line[i]) >= 0 || delimiters.indexOf(line[i]) >= 0 || line[i] == ' ') {
                    // 3 - 浮点数
                    if (temp.indexOf('.') >= 0) {
                        index = temp.indexOf('.');
                        // 0 - 错误：多个浮点
                        if (temp.slice(index + 1).indexOf('.') > 0)
                            species.push(["错误", -1, temp, "非法浮点数"]);
                        else
                            species.push(["浮点数", 3, temp]);
                    }
                    // 2 - 整数
                    else
                        species.push(["整数", 2, temp]);
                }
                else {
                    while (true) {
                        if (i > line.length - 1 || line[i] == ' ' || operators.indexOf(line[i]) >= 0 || delimiters.indexOf(line[i]) >= 0)
                            break;
                        else
                            temp += line[i];
                        i++;
                    }
                    species.push(["错误", -1, temp, "非法标识符"]);
                }

                continue;
            }


            // 7 - 字符串常数.优先级：2
            if (line[i] == '"' || line[i] == "'") {
                mark = line[i];
                temp = "";
                i++;
                while (line[i] != mark) {
                    temp += line[i];
                    i += 1;
                    // 超过一行的字符数则退出
                    if (i >= line.length - 1)
                        break;
                }

                // 引号闭合
                if (line[i] == mark) {
                    species.push(["字符串常数", 5, temp]);
                }

                // 引号未闭合
                else
                    species.push(["错误", -1, temp, "引号未闭合"]);

                i++;
                continue;
            }

            // 6 - 关键词，1 - 标识符。优先级：3
            temp = ""
            while (true) {
                if (i > line.length - 1 || line[i] == ' ' || operators.indexOf(line[i]) >= 0 || delimiters.indexOf(line[i]) >= 0)
                    break
                else
                    temp += line[i]
                i++;
            }
            i--;

            // 6 - 关键字：检索出来的单词在关键字集合中
            if (keywords.indexOf(temp) >= 0)
                species.push(["关键字", 6, temp]);
            // 检测非法标识符
            else {
                // 首字符应该为字母或下划线
                if (!(temp[0].match(/[a-zA-Z]/) || temp[0] == "_"))
                    species.push(["错误", -1, temp, "非法标识符"]);
                // 1 - 标识符：其他合法单词
                else
                    species.push(["标识符", 1, temp]);
            }
            i++;
        }
        // 当前行的每个字符遍历完毕
        row++;
    }
    return species;
}

function lexicalAnalysis() {
    after_preprocess = preprocess();

    var species = [];
    species = process(after_preprocess);

    token = "";
    //alert("词法分析完成");
    flag = true;    //判断词法分析是否出现错误
    for (let i = 0; i < species.length; i++) {

        if (species[i][1] == -1) {
            token += "<span style='color:red'>";
            token += JSON.stringify(species[i]) + "&emsp;&emsp;";
            token += "</span>";
            flag = false;
        } else {
            token += JSON.stringify(species[i]) + "&emsp;&emsp;";
        }
        if ((i + 1) % 5 == 0) {
            token += "</br>";
        }
    }

    document.getElementById("token").innerHTML = token;

    return [species, flag];
}

