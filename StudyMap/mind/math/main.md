# 数学 · 必修第一册（人教A版）

## 第一章 集合与常用逻辑用语
### 1.1 集合的概念
- **必考点**：集合元素的三大特性——确定性、互异性、无序性
- 元素与集合关系：属于 $a\in A$、不属于 $a\notin A$
- 常用数集符号：$\mathbb{N}$（自然数）、$\mathbb{N}^*$ 或 $\mathbb{N}_+$（正整数）、$\mathbb{Z}$（整数）、$\mathbb{Q}$（有理数）、$\mathbb{R}$（实数）
- 集合表示法：列举法、描述法 $\{x\mid p(x)\}$、图示法（Venn图）
### 1.2 集合间的基本关系
- **必考点**：子集 $A\subseteq B$、真子集 $A\subsetneqq B$、集合相等 $A=B$、空集 $\varnothing$
- **重难点**：含 $n$ 个元素的集合有 $2^n$ 个子集、$2^n-1$ 个真子集、$2^n-1$ 个非空子集、$2^n-2$ 个非空真子集
- **易错点**：空集是任何集合的子集，讨论 $A\subseteq B$ 时必须考虑 $A=\varnothing$
### 1.3 集合的基本运算
- **必考点**：并集 $A\cup B$、交集 $A\cap B$、补集 $\complement_U A$
- 运算性质：$A\cap\varnothing=\varnothing$，$A\cup\varnothing=A$，$\complement_U(\complement_U A)=A$
- **易错点**：区分点集 $\{(x,y)\mid y=x\}$ 与数集 $\{x\mid y=x\}$
### 1.4 充分条件与必要条件
- **必考点**：若 $p\Rightarrow q$，则 $p$ 是 $q$ 的充分条件，$q$ 是 $p$ 的必要条件
- $p\Leftrightarrow q$：充要条件
- **方法**：小范围 $\Rightarrow$ 大范围（充分不必要）；集合法判断
### 1.5 全称量词与存在量词
- 全称量词 $\forall$：命题 $\forall x\in M,p(x)$；存在量词 $\exists$：$\exists x\in M,p(x)$
- **必考点**：否定要"量词互换 + 结论否定"
  - $\forall x,p(x)$ 的否定是 $\exists x,\neg p(x)$；$\exists x,p(x)$ 的否定是 $\forall x,\neg p(x)$
- **易错点**：对含量词命题否定时只否定结论而忘记换量词
### 典型例题
- 例：已知 $A=\{x\mid -1<x<3\}$，$B=\{x\mid x>a\}$，若 $A\cap B=A$，则 $a\le -1$（注意端点可取）

## 第二章 一元二次函数、方程和不等式
### 2.1 等式性质与不等式性质
- 不等式八大基本性质（对称性、传递性、可加性、可乘性等）
- **易错点**：同向不等式可相加不可相减；同正同向可相乘；乘负数变号
### 2.2 基本不等式
- **必考点·重难点**：$\dfrac{a+b}{2}\ge\sqrt{ab}$（$a>0,b>0$），当且仅当 $a=b$ 取等号
- 重要变形：$a+b\ge 2\sqrt{ab}$；$ab\le\left(\dfrac{a+b}{2}\right)^2$
- 求最值口诀：**一正、二定、三相等**
  - 积定和最小：$ab=P$（定值）$\Rightarrow a+b\ge2\sqrt P$
  - 和定积最大：$a+b=S$（定值）$\Rightarrow ab\le\dfrac{S^2}{4}$
- 常见模型与配凑：$x+\dfrac{a}{x}\ge2\sqrt a$（$x>0$）；"1的代换"
- **易错点**：使用前必须验证"正数、定值、等号能取到"三条件
- 图示示例
  - ![基本不等式示意图](assets/basic-inequality.svg)
### 2.3 二次函数与一元二次方程、不等式
- **必考点·重难点**：三个"二次"关系（图象—方程根—不等式解集）
- 解一元二次不等式"三步走"：化标准（二次项系数为正）→ 求根 → 看图写解集
  - $\Delta>0$：大于取两边、小于取中间；$\Delta=0$；$\Delta<0$
- **易错点**：二次项系数含参数时讨论 $a>0,a=0,a<0$；注意 $\le,\ge$ 端点
- 恒成立：$ax^2+bx+c>0$ 恒成立 $\Leftrightarrow a>0$ 且 $\Delta<0$
### 典型例题
- 例：求 $y=x+\dfrac{4}{x}$（$x>0$）最小值：$y\ge2\sqrt4=4$，当 $x=2$ 取等
- 例：解不等式 $x^2-x-6>0$：根为 $-2,3$，解集 $(-\infty,-2)\cup(3,+\infty)$

## 第三章 函数的概念与性质
### 3.1 函数的概念及其表示
- **必考点**：函数三要素——定义域、对应关系、值域；两函数相同 $\Leftrightarrow$ 定义域与对应关系相同
- 定义域求法：分母不为0；偶次根号内非负；零次幂底数不为0；对数真数>0
- 表示法：解析法、列表法、图象法；分段函数
- **重难点**：求值域常用方法——观察法、配方法、换元法、分离常数法、单调性法
### 3.2 函数的基本性质
- **必考点·重难点**：单调性（增/减函数定义、用定义证单调性"取值—作差—变形—定号—结论"）
- 奇偶性：偶函数 $f(-x)=f(x)$，图象关于 $y$ 轴对称；奇函数 $f(-x)=-f(x)$，图象关于原点对称
- **易错点**：判断奇偶性先看定义域是否关于原点对称；奇函数若在 $x=0$ 有定义则 $f(0)=0$
- 复合与组合：奇±奇=奇，偶±偶=偶，奇×奇=偶，奇×偶=奇
- 最大（小）值：利用单调性、图象
### 3.3 幂函数
- $y=x^\alpha$；必记 $y=x,x^2,x^3,x^{1/2},x^{-1}$ 的图象与性质
- **规律**：$\alpha>0$ 在一象限递增、过 $(0,0),(1,1)$；$\alpha<0$ 递减、过 $(1,1)$
### 3.4 函数的应用（一）
- 分段函数建模、一次/二次函数实际应用，注意自变量实际取值范围
### 典型例题
- 例：证明 $f(x)=x+\dfrac{1}{x}$ 在 $(1,+\infty)$ 单调递增（作差因式分解）
- 例：$f(x)$ 为奇函数且 $x>0$ 时 $f(x)=x^2+1$，求 $x<0$ 时解析式：$f(x)=-x^2-1$

## 第四章 指数函数与对数函数
### 4.1 指数
- $n$ 次方根；分数指数幂 $a^{m/n}=\sqrt[n]{a^m}$（$a>0$）；$a^0=1$，$a^{-n}=\dfrac1{a^n}$
- 运算性质：$a^m a^n=a^{m+n}$，$(a^m)^n=a^{mn}$，$(ab)^n=a^n b^n$
### 4.2 指数函数
- **必考点·重难点**：$y=a^x$（$a>0,a\ne1$）
  - $a>1$ 递增；$0<a<1$ 递减；恒过 $(0,1)$；值域 $(0,+\infty)$
- **易错点**：底数范围；比较大小借助单调性与中间量（0、1）
### 4.3 对数
- **必考点**：$\log_a N=b\Leftrightarrow a^b=N$（$a>0,a\ne1,N>0$）
- 常用对数 $\lg$（底10）、自然对数 $\ln$（底e）
- 性质：$\log_a1=0$，$\log_a a=1$，$a^{\log_a N}=N$
- 运算法则：$\log_a(MN)=\log_aM+\log_aN$；$\log_a\dfrac MN=\log_aM-\log_aN$；$\log_a M^n=n\log_a M$
- 换底公式：$\log_ab=\dfrac{\log_cb}{\log_ca}$；推论 $\log_ab\cdot\log_ba=1$
### 4.4 对数函数
- **必考点·重难点**：$y=\log_a x$，恒过 $(1,0)$，定义域 $(0,+\infty)$
  - $a>1$ 递增；$0<a<1$ 递减
- **易错点**：定义域（真数>0）；底数含参讨论；指数与对数函数互为反函数（图象关于 $y=x$ 对称）
### 4.5 函数的应用（二）
- **必考点**：零点存在定理——$y=f(x)$ 在 $[a,b]$ 连续且 $f(a)f(b)<0$，则 $(a,b)$ 内有零点
- 二分法求零点近似值；函数模型（指数增长/对数增长/幂函数增长）的比较
- **易错点**：$f(a)f(b)<0$ 是有零点的充分非必要条件
### 典型例题
- 例：计算 $\log_2 8+\lg100+\ln e=3+2+1=6$
- 例：求 $f(x)=\log_2(x-1)$ 定义域：$x>1$

## 第五章 三角函数
### 5.1 任意角和弧度制
- 正角、负角、零角；象限角；终边相同的角 $\{\beta\mid\beta=\alpha+k\cdot360^\circ\}$
- 弧度制：弧度数 $\alpha=\dfrac lr$；$180^\circ=\pi\text{ rad}$；弧长 $l=|\alpha|r$，扇形面积 $S=\dfrac12|\alpha|r^2$
### 5.2 三角函数的概念
- **必考点**：单位圆定义 $\sin\alpha=y,\cos\alpha=x,\tan\alpha=\dfrac yx$
- 各象限符号口诀"一全正、二正弦、三正切、四余弦"
- 同角基本关系：$\sin^2\alpha+\cos^2\alpha=1$，$\dfrac{\sin\alpha}{\cos\alpha}=\tan\alpha$
### 5.3 诱导公式
- **必考点**：口诀"奇变偶不变，符号看象限"（$k\cdot\dfrac\pi2\pm\alpha$）
### 5.4 三角函数的图象与性质
- **必考点·重难点**：$y=\sin x$、$y=\cos x$、$y=\tan x$ 的图象、周期、奇偶、单调区间、最值
- 周期：$\sin,\cos$ 周期 $2\pi$，$\tan$ 周期 $\pi$
### 5.5 三角恒等变换
- **必考点·重难点**：两角和差公式
  - $\cos(\alpha\pm\beta)=\cos\alpha\cos\beta\mp\sin\alpha\sin\beta$
  - $\sin(\alpha\pm\beta)=\sin\alpha\cos\beta\pm\cos\alpha\sin\beta$
  - $\tan(\alpha\pm\beta)=\dfrac{\tan\alpha\pm\tan\beta}{1\mp\tan\alpha\tan\beta}$
- 二倍角：$\sin2\alpha=2\sin\alpha\cos\alpha$；$\cos2\alpha=\cos^2\alpha-\sin^2\alpha=1-2\sin^2\alpha=2\cos^2\alpha-1$
- 辅助角公式：$a\sin x+b\cos x=\sqrt{a^2+b^2}\sin(x+\varphi)$
### 5.6 函数 $y=A\sin(\omega x+\varphi)$
- **重难点**：振幅 $A$、周期 $T=\dfrac{2\pi}{|\omega|}$、初相 $\varphi$；图象变换（平移、伸缩）
- **易错点**：先平移后伸缩与先伸缩后平移的平移量不同
### 5.7 三角函数的应用
- 用三角函数解决周期性实际问题（简谐运动、潮汐等）
### 典型例题
- 例：已知 $\sin\alpha=\dfrac35$，$\alpha$ 在第二象限，求 $\cos\alpha=-\dfrac45$，$\tan\alpha=-\dfrac34$
- 例：求 $y=2\sin\left(2x+\dfrac\pi3\right)$ 的振幅2、周期 $\pi$、初相 $\dfrac\pi3$

## 相关学科
- [物理 · 运动与力](subject:physics)
- [化学 · 定量计算](subject:chemistry)
