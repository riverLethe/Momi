# 记账 APP 产品需求描述

## 1. 账单录入模块

### 1.1 聊天机器人智能录入

**功能目的**：
此功能旨在为用户提供一种快速、便捷且接近自然交互方式的账单录入体验。通过模拟对话，降低用户记录账单的心理门槛。用户输入的账单信息，若在家庭空间上下文中操作，将由 AI 进行解析并自动同步给家庭成员。

**用户故事/使用场景**：

- 我希望能通过简单地发送一句话（例如“今天为家里买了菜，花了 58 元”）或一张购物小票照片给聊天机器人，就能快速完成一笔账单的记录。如果我当前在家庭空间操作，这笔账单会自动共享，其他家庭成员也能看到。
- 当我用公司账户支付了一笔个人开销，我希望能明确这笔账单只记录在我个人账下（即在个人视图下操作录入）。

**输入**：

- 用户在聊天界面输入的纯文本信息。
- 用户拍摄或上传的图片文件（购物小票、发票等）。
- 用户上传的 CSV 或 Excel 文件（主要用于个人账单批量导入）。

**输出**：

- 聊天机器人对用户输入的即时反馈。
- AI 解析后，在聊天界面或账单列表中生成一条结构化的账单记录。如果用户当前在家庭空间上下文中操作，则该账单将自动同步给其家庭空间的其他成员。
- 对账单自动归属（个人或家庭）的确认或提示。

**业务规则**：

1.  聊天机器人应能理解账单录入指令。
2.  AI 应能识别账单要素。图片质量影响识别率。
3.  AI 解析引擎的目标准确率为 90%。低置信度结果应提示创建者校正。
4.  若用户在家庭空间上下文中录入账单，该账单自动成为家庭账单。
5.  **操作权限**：只有账单的创建者可以编辑或删除通过此方式录入的账单。

**界面元素描述 (配合线框图)**：

- 聊天界面，包含文本输入框、发送按钮、附件按钮。
- 聊天记录区显示对话和账单摘要。
- 界面上无需提供手动的“共享到家庭”的开关或选项。

### 1.2 AI 账单解析与用户校正

**功能目的**：
作为聊天机器人录入的后台支撑，将非结构化信息转化为标准账单数据，并提供给账单创建者进行审查和修正机制，确保账单的最终准确性。

**用户故事/使用场景**：

- AI 将我为家庭购买的“牛奶”错误识别为“饮料”，作为账单创建者，我希望能快速更正这个类别，以便家庭账单统计准确。
- 其他家庭成员看到我录入的一条家庭账单有疑问，但他们不能修改，只能查看或提醒我来校正。

**输入**：

- 来自聊天机器人或文件导入的原始数据。
- 账单创建者在校正界面进行的修改操作。

**输出**：

- 一条结构化的账单记录。若为家庭账单（即在家庭空间上下文中创建的），更新后的账单将同步给家庭空间的其他成员。
- 校正界面清晰展示 AI 解析的原始字段值和用户修改后的值。

**业务规则**：

1.  AI 解析引擎处理日期、金额、商户、类别等。
2.  系统维护可扩展的商户库和消费类别库。
3.  **操作权限**：只有账单的原始创建者有权进行校正操作。其他家庭成员查看时，校正功能不可用或隐藏。
4.  用户校正操作应实时保存并同步（若是家庭账单）。

**界面元素描述 (配合线框图)**：

- 账单详情/编辑页面，AI 解析字段预填充。
- 若当前用户是创建者，则字段可编辑，有“保存”按钮。
- 若当前用户非创建者（查看他人创建的家庭账单），则字段为只读状态，无“保存”按钮。

### 1.3 手动添加与编辑账单

**功能目的**：
提供结构化的表单供用户手动输入或修改账单。遵守简化的操作规则和隐式共享逻辑。

**用户故事/使用场景**：

- 我想手动为家庭记录一笔水电费支出，在我家庭空间视图下录入后，它会自动共享，确保所有家庭成员都能看到。
- 我发现我之前录入的一笔个人账单金额错了，希望能方便地找到并修改它。
- 我的配偶查看我录入的一条家庭账单时，发现商户名不准确，她不能直接改，但可以告诉我，由我来编辑。

**输入**：

- 用户在表单中输入的各项账单信息：日期、金额、类别、商户、支付账户（个人）、备注等。
- 账单创建者对现有账单的修改操作。

**输出**：

- 一条新的或更新后的账单记录。若在家庭空间上下文中创建/编辑，则自动同步给家庭空间成员。
- 成功保存或更新后的提示信息。

**业务规则**：

1.  金额、日期、类别、支付账户（个人）为核心字段。
2.  **隐式共享**：添加新账单时，若用户已在家庭空间上下文中操作，该账单自动成为家庭账单，无需额外选择。
3.  **编辑/删除权限**：只有账单的原始创建者可以编辑或删除账单。打开非自己创建的家庭账单时，所有字段为只读，编辑/删除按钮禁用或隐藏。

**界面元素描述 (配合线框图)**：

- 全屏或模态表单界面。
- 顶部包含“取消/返回”、“保存”（仅创建者可操作时启用）按钮。
- 表单字段：金额、类别、账户（个人支付账户）、日期、商户、备注。
- 界面上无需提供手动的“共享到家庭”的开关或选项。
- 若为只读模式（查看他人创建的家庭账单），所有输入控件变为不可编辑的文本展示，隐藏“保存”按钮，可显示“账单创建者：XXX”。

## 2. 消费分析与展示模块

### 2.1 关键数据指标展示

**功能目的**：
将原始账单数据转化为有意义的财务洞察，支持“个人”和“家庭”两种视图的分析。帮助用户从宏观层面了解其消费模式、支出结构和财务健康状况。

**用户故事/使用场景**：

- 我想知道我个人这个月在“餐饮”上总共花了多少钱。
- 我想切换到家庭视图，快速了解我们整个家庭本月的总支出、以及各项主要开支的汇总报告（这些都是家庭成员自动共享的账单）。
- 我想在个人视图和家庭视图之间轻松切换，查看不同范围的财务概览。

**输入**：

- 用户选择的分析视图：“个人”或“家庭 - [家庭空间名称]”。
- 特定时间范围内的账单数据（根据视图筛选个人创建的账单或家庭空间内所有成员创建的账单）。
- 用户选择的分析维度（类别、支付账户等，支付账户仅在个人视图下有意义）。

**输出**：

- 在 APP 的概览页或报表页，根据所选视图（个人/家庭）展示各项关键数据指标。
- 例如，在“家庭”视图下：该家庭当期总支出、按消费类别汇总的家庭支出金额及占比等。
- 例如，在“个人”视图下：该用户个人当期总支出、个人各消费类别支出等。

**业务规则**：

1.  数据指标计算准确，严格区分个人数据和家庭数据。
2.  提供清晰的视图切换机制（例如，页面顶部有“个人”/“家庭 - [家庭空间名称]”的切换标签或按钮）。
3.  家庭数据汇总时，包含该家庭空间内所有成员创建的账单。

**界面元素描述 (配合线框图)**：

- 概览页或报表页顶部增加“个人”/“家庭 - [家庭空间名称]”的视图切换器。
- 关键指标卡片根据当前视图动态更新其数据来源和展示内容。

### 2.2 动态图表可视化

**功能目的**：
通过图形化方式将复杂的个人或家庭消费数据变得直观易懂，帮助用户快速发现趋势、比较差异、理解构成。

**用户故事/使用场景**：

- 我想看看我个人每个月在娱乐上的花费趋势。
- 我想通过饼图了解我们整个家庭上个月的钱主要花在了哪些方面（基于所有成员自动共享的账单）。

**输入**：

- 用户选择的分析视图：“个人”或“家庭 - [家庭空间名称]”。
- 经过筛选和聚合的账单数据（根据视图）。
- 用户选择的图表类型和分析维度。

**输出**：

- 根据所选视图（个人/家庭）动态生成的各类图表（柱状图、折线图、饼图等）。
- 图表包含必要的标签、图例，清晰易懂。
- 图表支持基本交互，如点击查看数据详情。

**业务规则**：

1.  系统根据数据特性和视图推荐或允许用户选择图表类型。
2.  图表数据与账单数据（个人创建的或家庭空间内所有成员创建的）实时同步。
3.  家庭视图下的图表，应能清晰反映是基于整个家庭的数据。

**界面元素描述 (配合线框图)**：

- 报表页的图表区域。
- 视图切换器（个人/家庭）会影响图表的数据源。
- 图表类型选择器、时间范围选择器等辅助控件。

### 2.3 数据筛选与排序

**功能目的**：
赋予用户更强的自主性，使其能够根据自身需求深入探索和分析个人或家庭的账单数据。

**用户故事/使用场景**：

- 我想查看我个人上个月所有交通费用的明细，并按金额从高到低排序。
- 在家庭视图下，我想筛选出所有由我配偶记录的，且金额超过 100 元的家庭账单。
- 我想查看整个家庭在“餐饮”方面的所有账单，并按日期排序。

**输入**：

- 用户选择的分析视图：“个人”或“家庭 - [家庭空间名称]”。
- 用户的筛选条件：时间范围、消费类别、金额范围、商户名称、备注内容。
- **家庭视图下的额外筛选条件**：账单创建者（从家庭成员列表中选择）。
- 用户的排序选择：排序字段和方式。

**输出**：

- 一个经过筛选和/或排序的账单列表（根据视图）。
- 动态更新的图表（如果适用）。
- 清晰展示当前应用的筛选条件。

**业务规则**：

1.  用户可以组合使用多个筛选条件。
2.  筛选条件和排序规则易于设置和清除。
3.  在家庭视图下，按“账单创建者”筛选时，列表应显示对应成员记录的家庭账单。

**界面元素描述 (配合线框图)**：

- 账单列表页或报表页的筛选区域。
- 筛选条件中，当处于“家庭”视图时，增加“按成员筛选”的选项。

## 3. 预算管理模块 (轻量化 - 针对个人)

_(此模块保持不变，仅针对用户个人账单，不涉及家庭共享)_

### 3.1 个人预算设置

**功能目的**：
帮助用户主动规划其个人未来一段时间（通常是每月）的支出上限，针对不同消费类别或总支出进行设定。此功能主要针对用户个人财务规划。

**用户故事/使用场景**：

- 我每个月想控制我个人的餐饮支出在 1000 元以内，希望能设置一个个人餐饮预算。

**输入**：

- 用户选择的预算周期、预算对象（个人总预算或特定消费类别）、金额上限。

**输出**：

- 成功创建或更新的个人预算条目。

**业务规则**：

1.  预算金额为正数。
2.  预算仅基于用户个人账单数据跟踪。

**界面元素描述 (配合线框图)**：

- 个人预算管理界面，明确提示此为“个人预算”。

### 3.2 个人预算跟踪与提醒

**功能目的**：
实时监控用户在已设个人预算下的实际支出情况，并反馈进度和提醒。

**用户故事/使用场景**：

- 我设置了个人餐饮预算，希望能看到已用和剩余额度。

**输入**：

- 个人预算金额、个人实时账单数据。

**输出**：

- 预算项展示（预算金额、已用、剩余、进度），超支提醒。

**业务规则**：

1.  跟踪数据准确，仅基于个人账单。

**界面元素描述 (配合线框图)**：

- 个人预算项清晰展示进度，超支有标记。

## 4. 轻量化家庭共享模块 (隐式共享模型)

### 4.1 家庭空间创建与加入 (简化)

**功能目的**：
允许用户创建新的“家庭空间”或通过邀请加入已有的空间，以自动共享账单。

**用户故事/使用场景**：

- 我想创建一个“我的小家”家庭空间，并获取一个邀请码，让我的配偶通过邀请码加入，之后我们各自记录的账单（在家庭空间上下文中）就能自动互相看到了。

**输入**：

- 创建家庭空间：用户输入的家庭空间名称。
- 加入家庭空间：用户输入的邀请码。

**输出**：

- 成功创建家庭空间，用户成为该空间成员。
- 成功加入家庭空间，用户成为该空间成员。
- 用户界面上显示当前所属的家庭空间信息，或提供切换不同家庭空间的入口（如果支持加入多个）。

**业务规则**：

1.  一个用户可以创建或加入一个或多个家庭空间。
2.  家庭空间名称在一定范围内应具有可识别性。
3.  邀请码应具有时效性和唯一性，由系统生成。

**界面元素描述 (配合线框图)**：

- “我的”页面或专门的“家庭空间”页面。
- “创建家庭空间”按钮：点击后弹出输入家庭空间名称的表单。
- “加入家庭空间”按钮：点击后弹出输入邀请码的表单。
- 显示当前已加入/管理的家庭空间列表，可切换当前活动的家庭空间。

### 4.2 家庭成员查看与基本管理 (简化)

**功能目的**：
家庭空间的创建者可以邀请他人加入和移除成员。成员可以主动退出。

**用户故事/使用场景**：

- 作为家庭空间的创建者，我想邀请我的孩子加入，并发给他们邀请码。
- 有成员不再需要共享账单了，作为创建者，我希望能将他从家庭空间中移除。
- 我暂时不想参与某个家庭空间的账单共享了，希望能主动退出。

**输入**：

- 创建者操作：生成邀请码/链接，从成员列表中选择移除成员。
- 成员操作：主动退出家庭空间的确认。

**输出**：

- 家庭空间成员列表的更新。
- 成功邀请/移除/退出的提示。

**业务规则**：

1.  家庭空间的创建者拥有邀请和移除成员的权限。
2.  被邀请用户通过邀请码加入后成为成员。
3.  成员退出或被移除后，其历史创建的家庭账单仍保留在家庭空间中，并标记原创建者信息。

**界面元素描述 (配合线框图)**：

- 家庭空间详情页内。
- “家庭成员列表”：显示所有成员的昵称/头像。创建者有特殊标记或额外操作项。
- 创建者视图下：有“邀请新成员”（生成邀请码）按钮，每个成员旁有“移除”选项。
- 普通成员视图下：有“退出家庭空间”按钮。

### 4.3 隐式账单共享与同步

**功能目的**：
确保家庭成员创建的账单能够及时、准确地在其家庭空间的所有成员间自动同步。

**用户故事/使用场景**：

- 我在超市用我的支付宝为家庭购买了日用品，在我家庭空间视图下记录账单后，我的配偶能立即在她的 APP 上（切换到家庭视图时）看到这笔支出，我不需要做任何额外的“共享”操作。

**输入**：

- 家庭空间的成员创建或更新一条账单（在家庭空间上下文中）。

**输出**：

- 该账单信息（包含所有字段和创建者信息）将自动实时或准实时地出现在该家庭空间下所有其他成员的账单列表（家庭视图）和相关报表（家庭视图）中。

**业务规则**：

1.  账单同步需通过后端服务器进行。
2.  确保数据一致性：任何对家庭账单的修改（仅限创建者）都应同步给所有成员。
3.  离线处理：用户在离线状态下录入的家庭账单，在恢复网络连接后应自动同步。
4.  明确账单的“创建者”属性，并在显示时清晰标示。

**界面元素描述 (配合线框图)**：

- 账单列表项中，对于家庭账单，可以显示创建者的头像或昵称。
- 系统应有状态提示，如“正在同步…”或“同步完成”。
- 账单录入/编辑界面不应出现“共享”开关或选项。

### 4.4 简化的账单操作规则

**功能目的**：
明确在轻量化家庭共享模型下，对账单的操作权限，核心是创建者负责制，共享是自动的。

**用户故事/使用场景**：

- 我录入的家庭账单，我希望能修改金额或类别；但我配偶录入的家庭账单，我只能看，不能改，这样能避免混乱。

**业务规则**：

1.  **账单所有权**: 每条账单记录其“创建者 UserID”。
2.  **编辑/删除权限**: 仅账单的“创建者”有权编辑或删除该账单，无论该账单是否在家庭空间内。
3.  **查看权限**: 家庭空间内的所有成员均可查看该空间内所有成员创建的账单。

**界面元素描述 (配合线框图)**：

- 在账单详情页，编辑/删除按钮的显隐或可用状态根据当前用户是否为创建者动态变化。

### 4.5 家庭视图的消费分析

**功能目的**：
在消费分析与展示模块中，提供一个“家庭视图”，汇总展示特定家庭空间内的所有成员创建的账单数据。

**用户故事/使用场景**：

- 我想切换到“家庭”视图，查看我们家这个月总共在伙食上花了多少钱（这些都是家庭成员们自动共享的账单）。

**输入**：

- 用户在报表或概览页选择“家庭 - [家庭空间名称]”分析视图。
- 该家庭空间内所有成员创建的账单数据。

**输出**：

- 汇总后的家庭消费报表、图表和关键数据指标。
- 可能包括：家庭总支出/收入（基于所有成员创建的账单）、按类别汇总的家庭支出、家庭整体消费趋势等。

**业务规则**：

1.  家庭分析数据基于该家庭空间内所有成员创建的账单。
2.  确保数据汇总的准确性。
3.  用户可以方便地在个人分析视图和家庭分析视图间切换。

**界面元素描述 (配合线框图)**：

- 消费分析/报表页的顶部或显著位置提供“个人”/“家庭 - [家庭空间名称]”的视图切换控件。
- 切换到“家庭”视图后，所有图表和数据显示该家庭空间的汇总数据。

## 5. 账单导出模块 (轻量化)

### 5.1 导出格式与范围

**功能目的**：
为用户提供将其账单数据导出到外部文件的能力，支持个人数据和家庭数据的导出。

**用户故事/使用场景**：

- 我想把我个人过去一年的所有账单导出为 CSV 文件进行备份。
- 我想将我们家庭空间上个月的所有账单（所有成员创建的）导出为 PDF 报表，用于家庭存档。

**输入**：

- 用户选择的导出文件格式（CSV, PDF）。
- 用户选择的导出数据范围：
  - **数据视图**：“我的个人账单”（用户创建的所有账单）或“家庭账单 - [家庭空间名称]”（指定家庭空间的所有成员创建的账单）。
  - 时间周期。

**输出**：

- 一个包含所选账单数据的 CSV 或 PDF 文件。
- 导出成功或失败的提示信息。

**业务规则**：

1.  CSV 文件包含账单主要字段，家庭账单 CSV 应包含“创建者”列。
2.  PDF 报表应清晰易读。
3.  导出“家庭账单”（即家庭空间内所有成员创建的账单）对该家庭空间的所有成员开放。
4.  用户应能指定导出的时间范围。

**界面元素描述 (配合线框图)**：

- 导出设置页面。
- 增加“导出内容”选项：选择“我的个人账单”或“家庭账单 ([家庭空间名称])”。
- “开始导出”按钮。
