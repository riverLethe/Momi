import { PrismaClient } from "@prisma/client";
import { AuthService } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. 创建系统分类
  console.log("📁 Creating categories...");
  const categories = [
    // 餐饮
    {
      name: "food_dining",
      displayName: "餐饮",
      icon: "utensils",
      color: "#FF6B35",
    },
    {
      name: "food_fast",
      displayName: "快餐",
      icon: "coffee",
      color: "#FF8E53",
      parentName: "food_dining",
    },
    {
      name: "food_grocery",
      displayName: "生鲜",
      icon: "shopping-cart",
      color: "#FFA07A",
      parentName: "food_dining",
    },

    // 交通
    { name: "transport", displayName: "交通", icon: "car", color: "#4ECDC4" },
    {
      name: "transport_gas",
      displayName: "加油",
      icon: "fuel",
      color: "#45B7B8",
      parentName: "transport",
    },
    {
      name: "transport_public",
      displayName: "公交地铁",
      icon: "bus",
      color: "#6C5CE7",
      parentName: "transport",
    },
    {
      name: "transport_taxi",
      displayName: "打车",
      icon: "zap",
      color: "#A29BFE",
      parentName: "transport",
    },

    // 娱乐
    {
      name: "entertainment",
      displayName: "娱乐",
      icon: "gamepad-2",
      color: "#FD79A8",
    },
    {
      name: "entertainment_movie",
      displayName: "电影",
      icon: "film",
      color: "#FDCB6E",
      parentName: "entertainment",
    },
    {
      name: "entertainment_game",
      displayName: "游戏",
      icon: "gamepad",
      color: "#6C5CE7",
      parentName: "entertainment",
    },

    // 购物
    {
      name: "shopping",
      displayName: "购物",
      icon: "shopping-bag",
      color: "#00B894",
    },
    {
      name: "shopping_clothes",
      displayName: "服装",
      icon: "shirt",
      color: "#00CEC9",
      parentName: "shopping",
    },
    {
      name: "shopping_electronics",
      displayName: "数码",
      icon: "smartphone",
      color: "#74B9FF",
      parentName: "shopping",
    },

    // 医疗
    {
      name: "healthcare",
      displayName: "医疗",
      icon: "heart",
      color: "#E17055",
    },
    {
      name: "healthcare_medicine",
      displayName: "药品",
      icon: "pill",
      color: "#E84393",
      parentName: "healthcare",
    },

    // 教育
    { name: "education", displayName: "教育", icon: "book", color: "#0984E3" },
    {
      name: "education_course",
      displayName: "培训",
      icon: "graduation-cap",
      color: "#6C5CE7",
      parentName: "education",
    },

    // 居住
    { name: "housing", displayName: "居住", icon: "home", color: "#2D3436" },
    {
      name: "housing_rent",
      displayName: "房租",
      icon: "key",
      color: "#636E72",
      parentName: "housing",
    },
    {
      name: "housing_utilities",
      displayName: "水电费",
      icon: "zap",
      color: "#FDCB6E",
      parentName: "housing",
    },

    // 其他
    {
      name: "others",
      displayName: "其他",
      icon: "more-horizontal",
      color: "#B2BEC3",
    },
  ];

  // 首先创建父分类
  const parentCategories = categories.filter((cat) => !cat.parentName);
  for (const category of parentCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        displayName: category.displayName,
        icon: category.icon,
        color: category.color,
        isSystem: true,
      },
    });
  }

  // 然后创建子分类
  const childCategories = categories.filter((cat) => cat.parentName);
  for (const category of childCategories) {
    const parent = await prisma.category.findUnique({
      where: { name: category.parentName! },
    });

    if (parent) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: {
          name: category.name,
          displayName: category.displayName,
          icon: category.icon,
          color: category.color,
          parentId: parent.id,
          isSystem: true,
        },
      });
    }
  }

  console.log(`✅ Created ${categories.length} categories`);

  // 2. 创建演示用户
  console.log("👤 Creating demo user...");
  const demoUser = await AuthService.register(
    "demo@momiq.com",
    "password123",
    "Demo User",
    "seed-script",
    "127.0.0.1",
    "Seed Script"
  );

  if (demoUser) {
    console.log(`✅ Created demo user: ${demoUser.user.email}`);

    // 3. 创建示例预算
    console.log("💰 Creating sample budgets...");
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    await prisma.budget.create({
      data: {
        userId: demoUser.user.id,
        name: "月度总预算",
        amount: 5000.0,
        period: "monthly",
        startDate: startOfMonth,
        endDate: endOfMonth,
        alertThreshold: 80.0, // 80%警告
      },
    });

    const foodCategory = await prisma.category.findUnique({
      where: { name: "food_dining" },
    });

    if (foodCategory) {
      await prisma.budget.create({
        data: {
          userId: demoUser.user.id,
          name: "餐饮预算",
          amount: 1500.0,
          period: "monthly",
          category: foodCategory.name,
          startDate: startOfMonth,
          endDate: endOfMonth,
          alertThreshold: 90.0,
        },
      });
    }

    console.log("✅ Created sample budgets");

    // 4. 创建示例账单
    console.log("🧾 Creating sample bills...");
    const sampleBills = [
      {
        amount: 28.5,
        category: "food_dining",
        categoryName: "餐饮",
        merchant: "麦当劳",
        note: "午餐",
        paymentMethod: "credit_card",
        billDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
        tags: JSON.stringify(["快餐", "午餐"]),
      },
      {
        amount: 65.8,
        category: "food_grocery",
        categoryName: "生鲜",
        merchant: "盒马鲜生",
        note: "周末采购",
        paymentMethod: "alipay",
        billDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
        tags: JSON.stringify(["生鲜", "蔬菜"]),
      },
      {
        amount: 15.0,
        category: "transport_public",
        categoryName: "公交地铁",
        merchant: "地铁",
        note: "上班通勤",
        paymentMethod: "transport_card",
        billDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
        tags: JSON.stringify(["通勤"]),
      },
      {
        amount: 89.9,
        category: "entertainment_movie",
        categoryName: "电影",
        merchant: "万达影城",
        note: "周末看电影",
        paymentMethod: "wechat_pay",
        billDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4天前
        tags: JSON.stringify(["娱乐", "电影"]),
      },
      {
        amount: 299.0,
        category: "shopping_clothes",
        categoryName: "服装",
        merchant: "Uniqlo",
        note: "买冬季外套",
        paymentMethod: "credit_card",
        billDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
        tags: JSON.stringify(["服装", "外套"]),
      },
    ];

    for (const bill of sampleBills) {
      await prisma.bill.create({
        data: {
          ...bill,
          userId: demoUser.user.id,
        },
      });
    }

    console.log(`✅ Created ${sampleBills.length} sample bills`);
  }

  // 5. 创建系统配置
  console.log("⚙️ Creating system configs...");
  await prisma.systemConfig.upsert({
    where: { key: "app_version" },
    update: { value: "1.0.0" },
    create: {
      key: "app_version",
      value: "1.0.0",
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "sync_batch_size" },
    update: { value: 100 },
    create: {
      key: "sync_batch_size",
      value: 100,
    },
  });

  console.log("✅ Created system configs");

  console.log("🎉 Database seeding completed successfully!");
  console.log("📧 Demo user: demo@momiq.com");
  console.log("🔐 Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
