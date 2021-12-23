

// 产生式，两个属性分别表示左部和右部
class Product {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }
}

// LR(0)项目，三个属性分别表示产生式左部、右部和圆点坐标（在对应坐标字符的左侧）
// 一个LR(0)项目是带圆点的产生式
class Item {
    constructor(left, right, index) {
        this.left = left;
        this.right = right;
        this.index = index;
    }
}

// 求文法G中V和T的FIRST集
function getFIRST(G) {
    // 初始化一个字典，用以存放终结符和非终结符的FIRST集
    var FIRST = {};

    // 1. 终结符的FIRST集就是终结符本身
    G['T'].forEach(X => {
        FIRST[X] = [X];
    });
    temp_V = new Set(G['V']);
    // 去掉S'
    // temp_V.discard(G['S'] + "'")
    temp_V.forEach(X => {
        FIRST[X] = [];
    });

    // 2. 如果一个产生式的右部第一个字符是终结符或者右部含有ε，则加入其左部字符的FIRST集
    G['P'].forEach(product => {
        left = product.left;
        if (G['T'].indexOf(product.right[0]) >= 0)
            FIRST[left].push(product.right[0]);
        if ((product.right).indexOf("ε") >= 0)
            FIRST[left].push("ε");
    });

    // 3. 对于V中所有非终结符X，检查产生式右部，增加FIRST(X)
    flag = true;
    // flag 用以记录一次循环后，FITST集是否扩大，若不扩大则终止循环
    while (flag) {
        flag = false;
        for (let p = 0; p < G['P'].length; p++) {
            product = G['P'][p];
            left = product.left;
            right = product.right;
            // 3.1 产生式右部第一个字符为非终结符，即 X->Y...
            // 则将FIRST(Y)中所有非ε元素添加到FIRST(X)中
            if (G['V'].indexOf(right[0]) >= 0)
                // unionFIRST 函数的返回值为FIRST集合是否扩大
                flag = unionFIRST(FIRST, left, right[0], true);

            // 3.2 产生式右部从第一个字符开始是连续的非终结符，即X->Y1...Yi...Yk
            // 如果右部长度为1，则等同于 3.1 直接跳过此步骤
            if (right.length == 1)
                continue;
            // 如果右部长度大于1，则进行以下分析
            else {
                // 设置是否需要添加ε
                has_epsilon = false;
                // 3.2.1 如果对于任何j，1<=j<=i-1，FIRST(Yj)都含有ε，
                // 则把FIRST(Yi)中所有非ε元素添加到FIRST(X)中
                for (let r = 0; r < right.length; r++) {
                    y = right[r];
                    has_epsilon = false;
                    if (FIRST[y].indexOf("ε") >= 0) {
                        has_epsilon = true;
                        flag = unionFIRST(FIRST, left, y, true);
                    }
                    if (!has_epsilon) {
                        flag = unionFIRST(FIRST, left, y, true);
                        break;
                    }
                }

                // 3.2.2 如果对于任何j，1<=j<=k，FIRST(Yj)都含有ε，
                // 则把ε添加到FIRST(X)中
                if (has_epsilon) {
                    if (unionFIRST(FIRST, left, "ε", false))
                        flag = true;
                }
            }
        }
    }

    // 将FIRST集打印到页面上
    var write = "";
    write += "<h4 style='color:#FF7F50'>FIRST set:</h4>";

    for (let k in FIRST) {
        write += "FIRST(" + k + ") = " + JSON.stringify(FIRST[k]) + "</br>";
    }

    document.getElementById("first").innerHTML = write;

    return FIRST;
}

// 求文法G中V的FOLLOW集
function getFOLLOW(G) {
    FIRST = getFIRST(G);
    // 初始化一个字典，用以存放终结符和非终结符的FOLLOW集
    var FOLLOW = {};

    set_V = new Set(G['V']);
    set_V.forEach(X => {
        FOLLOW[X] = [];
    });
    // 1. 对于文法的开始符号S，将#加入FOLLOW(S)中
    FOLLOW[G['S']] = ["#"];

    // 2. 对于产生式A→αBβ，则把FIRST(β)去掉ε添加到FOLLOW(B)中
    // flag 用以记录一次循环后，FOLLOW集是否扩大，若不扩大则终止循环
    flag = true;
    while (flag) {
        flag = false;
        for (let p = 0; p < G['P'].length; p++) {
            var product = G['P'][p];
            A = product.left;
            Y = product.right;
            for (let i = 0; i < Y.length; i++) {
                B = Y[i];
                // 2.1 如果B不是非终结符，则继续向后遍历直到找到非终结符
                if (G['V'].indexOf(B) == -1)
                    continue;
                // 2.2 找到第一个非终结符B
                // 2.2.1 产生式是 A→αB 型，将FOLLOW(A)加到FOLLOW(B)中
                if (i == Y.length - 1)
                    flag = unionFOLLOW(FOLLOW, B, A);
                // 2.2.2 产生式是 A→αBβ 型，进行讨论
                else {
                    // 获取β
                    beta = Y.slice(i + 1);
                    FIRST_beta = getAllFIRST(FIRST, beta);
                    // 2.2.2.1 如果 β=>ε 即 ε∈FIRST(β)，则等同于2.2.1
                    if (FIRST_beta.indexOf("ε") >= 0)
                        flag = unionFOLLOW(FOLLOW, B, A);
                    // 2.2.2.2 否则，求解出β的所有可能的FIRST集的元素，并且去除ε
                    set_B = new Set(FOLLOW[B]);
                    set_beta = new Set(FIRST_beta);
                    set_beta.delete("ε");

                    if (FOLLOW[B] === undefined)
                        before = 0;
                    else
                        before = FOLLOW[B].length;

                    var union_set = new Set();
                    set_B.forEach(element => {
                        union_set.add(element);
                    });
                    set_beta.forEach(element => {
                        union_set.add(element);
                    });
                    FOLLOW[B] = [...union_set];

                    after = FOLLOW[B].length;
                    if (before < after)
                        flag = true;
                }
            }
        }
    }

    // 将FOLLOW集打印到页面上
    var write = "";
    write += "<h4 style='color:#FF7F50'>FOLLOW set:</h4>";

    for (let k in FOLLOW) {
        write += "FOLLOW(" + k + ") = " + JSON.stringify(FOLLOW[k]) + "</br>";
        //console.log(FOLLOW[k])
    }
    document.getElementById("follow").innerHTML = write;

    return FOLLOW;
}

// 求两个FIRST集的并集，并返回该并集是否比原本的左侧集合更大，参数discard代表是否需要去除ε 
function unionFIRST(FIRST, X, Y, discard) {
    set_X = new Set(FIRST[X]);

    if (Y == "ε")
        set_Y = new Set("ε");
    else
        set_Y = new Set(FIRST[Y]);

    set_Y = new Set(FIRST[Y]);
    if (discard)
        set_Y.delete("ε");

    before = FIRST[X].length;

    var union_set = new Set();
    set_X.forEach(element => {
        union_set.add(element);
    });
    set_Y.forEach(element => {
        union_set.add(element);
    });
    FIRST[X] = [...union_set];

    after = FIRST[X].length;

    // console.log(FIRST[X]);

    return before < after;
}

// 求两个FOLLOW集的并集，并返回该并集是否比原本的左侧集合更大
function unionFOLLOW(FOLLOW, X, Y) {
    set_X = new Set(FOLLOW[X]);

    if (Y == "ε")
        set_Y = new Set("ε");
    else
        set_Y = new Set(FOLLOW[Y]);

    if (FOLLOW[X] === undefined)
        before = 0;
    else
        before = FOLLOW[X].length;

    var union_set = new Set();
    set_X.forEach(element => {
        union_set.add(element);
    });
    set_Y.forEach(element => {
        union_set.add(element);
    });
    FOLLOW[X] = [...union_set];

    after = FOLLOW[X].length;

    return before < after;
}


// 求V和T中a的所有FIRST集，a = Y1Y2...Yn
// 如果之前没有记录过对应的FIRST(a)，就将其添加到FIRST集中
function getAllFIRST(FIRST, a) {
    // 如果a是单个非终结符或者终结符，则FIRST(a)之前已经求过，直接返回即可
    if (a.length == 1) {
        // α = ε的特殊情况
        if (a.indexOf("ε") >= 0)
            FIRST["ε"] = ["ε"];
        return FIRST[a[0]];
    }

    // 如果a是多个非终结符或终结符的集合，就开始运行算法求解FIRST(a)
    a_str = "";
    a.forEach(X => {
        a_str = a_str + X + " ";
    });

    a_str = a_str.replace(/(^\s*)|(\s*$)/g, "");  // 删除句子前后空白字符
    FIRST[a_str] = [];

    // 类似于求解FIRST集
    has_epsilon = false;
    for (let i = 0; i < a.length; i++) {
        X = a[i];
        has_epsilon = false;
        if (FIRST[X].indexOf("ε") >= 0) {
            has_epsilon = true;
            unionFIRST(FIRST, a_str, X, true);
        }
        if (!has_epsilon) {
            unionFIRST(FIRST, a_str, X, true);
            break;
        }
    }

    // 如果Y1~Yn都能推出ε，就把ε也添加到FIRST中
    if (has_epsilon)
        unionFIRST(FIRST, a_str, "ε", false);
    return FIRST[a_str];
}

// 判断某个LR(0)项目是否存在于某个项目集中
function hasItem(item, set) {
    for (let i = 0; i < set.length; i++) {
        element = set[i];
        // 两个项目的左部、右部以及圆点所在位置全都相同，两个项目集才相同
        if (item.left == element.left && item.right == element.right && item.index == element.index)
            return true;//return,break,continue语句不要写在 forEach 里面！！！
    }
    return false;
}

// 判断两个LR(0)项目集是否相等
function setEqual(A, B) {
    n1 = A.length;
    n2 = B.length;
    //集合长度不等，则一定不相等
    if (n1 != n2)
        return false;
    for (let i = 0; i < n1; i++) {
        // 调用判断元素是否相同函数
        if (!itemEqual(A[i], B[i])) {
            return false;
        }
    }
    return true;
}

// 判断两个LR(0)项目是否相等
function itemEqual(a, b) {
    if (a.left == b.left && a.right == b.right && a.index == b.index)
        return true;
    return false;
}


// 在拓广文法G'中求解项目I的闭包J
function CLOSURE(G, I) {
    // 列表深拷贝，二者不会相互影响
    var [...J] = I; //J数组，用于存储闭包
    var [...E] = I; //E数组，模拟队列，用于记录还没有遍历到的项目

    // E数组用作队列，每次遍历时可在队尾追加若干元素，每次遍历当前队首元素后将其删除
    while (E.length > 0) {
        item = E[0];    // 取出E中第一个项目集
        // 圆点到达右部的最后位置，停止添加，否则继续执行
        if (item.index < (item.right).length) {
            // 获取圆点右部第一个单词
            B = item.right[item.index];
            // 如果是非终结符，则将左部为该非终结符的产生式循环加入闭包；
            // 如果是终结符，则不操作
            if (G['V'].indexOf(B) >= 0) {
                G['P'].forEach(product => {
                    // 把左部为该非终结符的产生式循环加入闭包
                    if (product.left == B) {
                        // 创建左部为该非终结符的LR(0)项目
                        temp = new Item(product.left, product.right, 0);
                        // 新创建的项目Item对象不在闭包里才能加入
                        if (!hasItem(temp, J)) {
                            J.push(temp);
                            E.push(temp);
                        }
                    }
                });
            }
        }
        E.shift();
    }

    return J;
}


// 项目集的状态转换函数，I是一个项目集，X是一个文法符号
// 即求出项目集I关于非终结符X的后继项目集（不一定有转移）
function GO(G, I, X) {
    var J = [];
    for (let i = 0; i < I.length; i++) {
        item = I[i];
        // 圆点位于项目右部的末尾则停止添加
        if (item.index >= (item.right).length)
            continue;
        // 获取圆点后面的第一个字符B
        B = item.right[item.index];
        // 如果B和下一个读入的字符X相同，则加入项目集
        if (B == X)
            if (G['V'].indexOf(B) >= 0 || G['T'].indexOf(B) >= 0)
                J.push(new Item(item.left, item.right, item.index + 1));
    }
    // 返回J的闭包作为项目集
    return CLOSURE(G, J);
}

// 输入拓广文法G'，计算其LR(0)项目集规范族C
function getLR0Collection(G) {
    var I = [];  // 项目集
    I.push(new Item(G['P'][0].left, G['P'][0].right, 0));  // 先加入第一个项目
    var C = [];  // 项目集规范族
    C.push((CLOSURE(G, I)));     // 先把第一个项目的闭包加入项目集规范族

    V_and_T = G['V'].concat(G['T']);    // 终结符集和非终结符集

    // 列表深拷贝，二者不会相互影响
    var [...E] = C; //E数组，相当于队列，用于记录还没有遍历到的项目
    while (E.length > 0) {
        IT = E[0];  // 取出E中第一个项目集
        // 对于一个项目集IT，根据项目集转移函数，判断每一个终结符和非终结符X，是否存在对应的后继项目集。
        // 如果存在（J不空），则将后继项目集J添加到C中
        // 如果不存在（J为空），则不进行操作
        // 循环上述操作，直至C中所有的项目集全部遍历一次（通过队列E来实现）
        V_and_T.forEach(X => {
            // 定义J为项目集IT关于字符X通过转移函数求出的后继项目集
            var J = GO(G, IT, X);
            // 项目集J不为空集的时候才考虑是否添加
            if (J.length > 0) {
                // 判断项目集J是否已经在项目集规范族C中
                flag = false;
                C.forEach(K => {
                    if (setEqual(J, K))
                        flag = true;
                });
                // 如果项目集J不在项目集规范族C中，则将其添加到C中
                if (!flag) {
                    C.push(J);
                    E.push(J);
                }
            }
        });

        // 把当前所遍历的项目集去除
        E.shift();
    }


    var write = "";
    write += "<h4 style='color:#FF7F50'>LR(0)项目集规范族:</h4>";

    for (let i = 0; i < C.length; i++) {
        write += "I(" + i + "):</br>";
        C[i].forEach(item => {
            right = "";
            for (let j = 0; j < (item.right).length; j++) {
                if (j == item.index)
                    right += ". ";
                right += item.right[j] + " ";
            }
            if (item.index >= (item.right).length)
                right += ".";
            write += item.left + " -> " + right;
            write += "</br>";
        });
        write += "</br>";
    }

    document.getElementById("LR0Collection").innerHTML = write;

    return C;
}


// 输入文法G的拓广文法G'，获取SLR(1)分析表
// 输入文法为非拓广文法
function getSLR1Table(G) {

    // 获取非拓广文法G的FOLLOW集，归约时要用，这是不同于LR(0)分析的地方
    FOLLOW = getFOLLOW(G);

    // 由非拓广文法G求解拓广文法G'，只需在产生式P最前边添加
    // S' -> S, 在非终结符V的最前边添加S'
    // 拓广文法的目的是保证文法的开始符号的定义只有一个产生式
    // 并且文法的开始符号不会出现在其他产生式的右部
    // 也保证了G'只有唯一的接受状态
    G['P'].unshift(new Product(G['S'] + "'", [G['S']]));
    G['V'].unshift(G['S'] + "'");

    // 求解拓广文法G'的LR0项目集规范族
    C = getLR0Collection(G);

    n = C.length;

    // ACTION表的初始化
    row = {};
    G['T'].forEach(t => {
        row[t] = "";
    });
    row["#"] = "";
    ACTION = [];
    for (let i = 0; i < n; i++) {
        // 对象深拷贝
        var r = Object.assign({}, row);
        ACTION.push(r);
    }

    // GOTO表的初始化
    temp_V = new Set(G['V']);
    temp_V.delete(G['S'] + "'"); // 去掉S'->S
    row = {}
    temp_V.forEach(v => {
        row[v] = "";
    });
    GOTO = [];
    for (let i = 0; i < n; i++) {
        // 对象深拷贝
        var r = Object.assign({}, row);
        GOTO.push(r);
    }


    /* ACTION表和GOTO表的构造：
    1. 若项目A->α.aβ属于I_k，且GO(I_k,a)=I_j，a为终结符，则置ACTION[k,a]为sj
    2. 若项目A->α.属于I_k，那么对任何终结符a∈FOLLOW(A),置ACTION[k,a]为rj，假定A->α为G'的第j个产生式
    3. 若项目S'->S.属于I_k，则置ACTION[k,#]为“acc”
    4. 若GO(I_k,A)=I_j，A为非终结符，则置GOTO[k,A]=j
    5. 若不为以上情况，则ACTION与GOTO表剩余单元格置为空，代表出现错误
    */

    for (let k = 0; k < n; k++) {
        I = C[k];
        for (let i = 0; i < I.length; i++) {
            item = I[i];
            // 如果圆点不在LR(0)项目的最右侧，则需要移进
            if (item.index < (item.right).length) {
                // 获取项目圆点的下一个字符
                ch = item.right[item.index];
                // 找出项目集I在读入下一个字符ch要跳转到的项目集
                // 即找到使得GO(G, I, ch) = C[j]成立的j
                for (let j = 0; j < n; j++) {
                    if (setEqual(GO(G, I, ch), C[j])) {
                        // 如果ch是终结符，则在ACTION表中进行记录状态转移
                        if (G['T'].indexOf(ch) >= 0)
                            ACTION[k][ch] = "s" + j;

                        // 如果是非终结符，则在GOTO表中进行记录状态转移
                        else
                            GOTO[k][ch] = j;

                        break;
                    }

                }
            }

            // 如果圆点在LR(0)项目的最右侧，则需要归约
            else {
                // 如果当前项目是S'->S.，则在ACTION表里添加acc，代表接受状态
                if (item.left == G['S'] + "'") {
                    ACTION[k]["#"] = "acc";
                    continue;
                }
                // 其他归约情况，找到P中对应的产生式序号
                m = (G['P']).length;
                for (let j = 1; j < m; j++) {
                    if (G['P'][j].left == item.left && G['P'][j].right == item.right) {
                        FOLLOW_A = FOLLOW[item.left];
                        // 面临的符号属于FOLLOW集或者为‘#’，都进行归约
                        G['T'].forEach(t => {
                            if (FOLLOW_A.indexOf(t) >= 0)
                                ACTION[k][t] = "r" + j;
                        });
                        if (FOLLOW_A.indexOf("#") >= 0) {
                            ACTION[k]["#"] = "r" + j;
                        }
                        break;
                    }
                }
            }
        }
    }


    // 输出ACTION和GOTO表到页面
    var write1 = "";
    write1 += "<h3 style='color:#FF7F50;text-align:center;'>ACTION table</h3>";
    write1 += "<table border='1' align='center' ><tr>"
    write1 += "<th width='40px' style='text-align:center;'>" + " " + "</th>";

    var i = 0;
    T = G['T'];
    T.forEach(t => {
        write1 += "<th width='40px' style='text-align:center;'>" + t + "</th>";
        i++;
    });
    write1 += "<th width='40px' style='text-align:center;'>#</th></tr>";
    var i = 0;
    ACTION.forEach(row => {
        write1 += "<tr><th width='40px' style='text-align:center;'>" + i + "</th>";
        for (key in row) {
            if (row[key] == "acc")
                write1 += "<th width='40px' style='text-align:center;color:green'>" + row[key] + "</th>";
            else if (row[key][0] == "s")
                write1 += "<th width='40px' style='text-align:center;color:#FA5094'>" + row[key] + "</th>";
            else if (row[key][0] == "r")
                write1 += "<th width='40px' style='text-align:center;color:#9370DB'>" + row[key] + "</th>";
            else
                write1 += "<th width='40px' style='text-align:center;'>" + row[key] + "</th>";
        }
        write1 += "</tr>";
        i++;
    });
    write1 += "</table>";


    var write2 = "";
    write2 += "<h3 style='color:#FF7F50;text-align:center;'>GOTO table</h3>";
    write2 += "<table border='1' align='center'><tr>"
    write2 += "<th width='100px' style='text-align:center;'>" + " " + "</th>";

    t_V = G['V'].slice(1);  //去除拓广文法开始符号
    t_V.forEach(v => {
        write2 += "<th width='100px' style='text-align:center;'>" + v + "</th>";
    });
    write2 += "</tr>";

    var i = 0;
    GOTO.forEach(row => {
        write2 += "<tr><th width='100px' style='text-align:center;'>" + i + "</th>";
        for (key in row) {
            write2 += "<th width='100px' style='text-align:center;'>" + row[key] + "</th>";
        }
        write2 += "</tr>";
        i++;
    });
    write2 += "</table>";


    // console.log(ACTION);
    // console.log(GOTO);

    document.getElementById("ACTIONtable").innerHTML = write1;
    document.getElementById("GOTOtable").innerHTML = write2;

    return [ACTION, GOTO];

}


// 输入文法G、SLR(1)的ACTION与GOTO分析表、词法分析得到的token串，输出LR分析结果
function SLR1Analysis(G, ACTION, GOTO, token) {

    // 状态栈
    stack_state = [0];

    // 符号栈
    stack_character = ["#"];

    // 输入缓冲区
    buffer = [];
    token.forEach(t => {
        if (t[0] == "标识符")
            buffer.push("id");
        else if (t[0] == "浮点数" || t[0] == "整数" || t[0] == "字符串常数")
            buffer.push("value");
        else
            buffer.push(t[2]);
    });
    buffer.push("#");


    var write = "";
    // 用于记录输入缓冲区当前下标的变量
    ip = 0;
    step = 0;
    while (true) {
        step += 1;
        write += "</br>";
        write += "<span style='color:#FF4500AA'>Step" + step + ":</span></br>";
        write += "状态栈:&emsp;";
        stack_state.forEach(ele => {
            write += ele + "&emsp;";
        });
        write += "</br>";

        write += "符号栈:&emsp;"
        stack_character.forEach(ele => {
            write += ele + "&emsp;";
        });
        write += "</br>";


        if (ip >= buffer.length)
            break;

        // 获得栈顶状态S以及ip指向的符号a
        S = stack_state[(stack_state).length - 1];
        a = buffer[ip];
        // console.log(a);

        write += "输入缓冲区: ";

        input = buffer.slice(ip);
        input.forEach(c => {
            write += c + "&emsp;";
        });
        write += "</br>";

        // 获取SLR1分析表中对应的字符串
        string = ACTION[S][a];
        // onsole.log(ACTION[S][a]);
        write += "分析表内容:&emsp;" + string + "</br>";
        write += "当前动作:&emsp;";

        // 出错
        if (string == "") {

            write += "<span  style='color:red'>出错</span>";
            write += "</br>";
            write += "</br><b><span style='color:red'>分析出错</span></b>";
            alert("SLR(1)分析失败");
            break;
        }

        // 需要转移至状态i，并且把a压入栈中
        else if (string[0] == 's') {
            i = parseInt(string.slice(1));
            write += "<span style='color:#FA5094'>移进</span>：将<b>状态" + i + "</b>压入状态栈，将<b>符号" + a + "</b>压入符号栈&emsp;</br>";
            stack_character.push(a);
            stack_state.push(i);
            ip++;
        }

        else if (string[0] == 'r') {
            k = parseInt(string.slice(1))
            n = (G['P'][k].right).length
            write += "<span style='color:#9370DB'>归约</span>：按照第" + k + "个产生式&emsp;<b>";
            (G['P'][k].right).forEach(ele => {
                write += ele + " ";
            });
            write += " => " + G['P'][k].left + '</b>&emsp;进行归约';
            A = G['P'][k].left;

            // 归约以后弹出n个符号
            stack_state = stack_state.slice(0, (stack_state).length - n);
            stack_character = stack_character.slice(0, (stack_character).length - n);

            // 查询GOTO表，将新的状态压入状态栈
            S = stack_state[(stack_state).length - 1]
            stack_state.push(parseInt(GOTO[S][A]));
            write += "，查询GOTO[" + S + "," + A + "]，将<b>状态" + GOTO[S][A] + "</b>压入状态栈" + "</br>";
            stack_character.push(A);
        }
        // 需要根据G中第k条产生式归约，两个栈各弹出n个符号，最后再查询GOTO表将新的状态压入状态栈

        // 分析成功
        else if (string == "acc") {
            write += "<span  style='color:green'>接受</span>";
            write += "</br>";
            write += "</br><b><span  style='color:green'>分析成功</span></b>";
            alert("SLR(1)分析成功");
            break;
        }
    }
    document.getElementById("SLR1").innerHTML = write;

}



function syntaxAnalysis() {

    // 定义文法
    G = {
        // 文法的开始符号
        'S': '程序',
        // 非终结符集
        'V': ['程序', '函数定义', '形式参数', '代码块', '变量类型', '算术表达式', '布尔表达式', '比较运算符', '算术运算符'],
        // 终结符集
        'T': ['id', 'value', '(', ')', '{', '}', ',', ';', '=', 'while', 'if', 'else', 'return', 'int', 'float', 'double', 'bool', 'char', '&&', '||', '!', 'true', 'false', '<', '>', '<=', '>=', '==', '!=', '-', '+', '*', '/'],
        // 产生式集
        'P': [
            new Product('程序', ['函数定义']),
            new Product('函数定义', ['函数定义', '函数定义']),
            new Product('函数定义', ['变量类型', 'id', '(', ')', '{', '代码块', '}']),
            new Product('函数定义', ['变量类型', 'id', '(', '形式参数', ')', '{', '代码块', '}']),
            new Product('形式参数', ['变量类型', 'id']),
            new Product('形式参数', ['变量类型', 'id', ',', '形式参数']),

            new Product('代码块', ['代码块', '代码块']),
            new Product('代码块', ['变量类型', 'id', ';']),
            new Product('代码块', ['变量类型', 'id', '=', '算术表达式', ';']),
            new Product('代码块', ['id', '=', '算术表达式', ';']),
            new Product('代码块', ['while', '(', '布尔表达式', ')', '{', '代码块', '}']),
            new Product('代码块', ['if', '(', '布尔表达式', ')', '{', '代码块', '}']),
            new Product('代码块', ['if', '(', '布尔表达式', ')', '{', '代码块', '}', 'else', '{', '代码块', '}']),
            new Product('代码块', ['return', ';']),
            new Product('代码块', ['return', '算术表达式', ';']),
            new Product('变量类型', ['int']),
            new Product('变量类型', ['float']),
            new Product('变量类型', ['double']),
            new Product('变量类型', ['bool']),
            new Product('变量类型', ['char']),

            new Product('算术表达式', ['算术表达式', '算术运算符', '算术表达式']),
            new Product('算术表达式', ['-', '算术表达式']),
            new Product('算术表达式', ['(', '算术表达式', ')']),
            new Product('算术表达式', ['id']),
            new Product('算术表达式', ['value']),
            new Product('布尔表达式', ['算术表达式', '比较运算符', '算术表达式']),
            new Product('布尔表达式', ['布尔表达式', '&&', '布尔表达式']),
            new Product('布尔表达式', ['布尔表达式', '||', '布尔表达式']),
            new Product('布尔表达式', ['!', '布尔表达式']),
            new Product('布尔表达式', ['(', '布尔表达式', ')']),
            new Product('布尔表达式', ['true']),
            new Product('布尔表达式', ['false']),

            new Product('比较运算符', ['<']),
            new Product('比较运算符', ['>']),
            new Product('比较运算符', ['<=']),
            new Product('比较运算符', ['>=']),
            new Product('比较运算符', ['==']),
            new Product('比较运算符', ['!=']),
            new Product('算术运算符', ['+']),
            new Product('算术运算符', ['-']),
            new Product('算术运算符', ['*']),
            new Product('算术运算符', ['/']),
        ]
    };


    console.log(G);

    Res = lexicalAnalysis();
    token = Res[0]; // 获取token表
    flag = Res[1];

    if (flag) {
        T = getSLR1Table(G);
        ACTION = T[0];
        GOTO = T[1];
        SLR1Analysis(G, ACTION, GOTO, token);
    }

    else {
        document.getElementById("first").innerHTML = "FIRST集合";
        document.getElementById("follow").innerHTML = "FOLLOW集合";
        document.getElementById("LR0Collection").innerHTML = "LR(0)项目集规范族";
        document.getElementById("ACTIONtable").innerHTML = "ACTION表";
        document.getElementById("GOTOtable").innerHTML = "GOTO表";
        document.getElementById("SLR1").innerHTML = "SLR(1)分析过程";
        alert("词法分析出现错误，无法进行语法分析");
    }

}


