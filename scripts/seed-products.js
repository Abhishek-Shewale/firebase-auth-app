const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { adminDb } = require("../lib/firebase-admin.js");




async function seedProducts() {
  const products = [
    {
      id: "usb-16gb",
      name: "USB 16GB + 1 Year AI Access",
      price: 1099,
      image: "/Usb.jpg",
      features: [
        "16GB USB Bundle",
        "One-Year Validity with Unlimited AI Access",
        "All Premium AI Features Included",
        "Covers All Subjects – No Restrictions",
        "Parent-Friendly Dashboard to Track Progress",
        "Access from Anywhere – Mobile, Laptop, Desktop"
      ],
    },
    {
      id: "usb-8gb",
      name: "USB 8GB + 1 Year AI Access",
      price: 799,
      image: "/Usb.jpg",
      features: [
        "8GB USB Bundle",
        "One-Year Validity with Unlimited AI Access",
        "All Premium AI Features Included",
        "Covers All Subjects – No Restrictions",
        "Parent-Friendly Dashboard to Track Progress",
        "Access from Anywhere – Mobile, Laptop, Desktop"
      ],
    },
    {
      id: "usb-4gb",
      name: "USB 4GB + 1 Year AI Access",
      price: 599,
      image: "/Usb.jpg",
      features: [
        "4GB USB Bundle",
        "One-Year Validity with Unlimited AI Access",
        "All Premium AI Features Included",
        "Covers All Subjects – No Restrictions",
        "Parent-Friendly Dashboard to Track Progress",
        "Access from Anywhere – Mobile, Laptop, Desktop"
      ],
    }
  ];

  try {
    for (const product of products) {
      const docRef = adminDb.collection("products").doc(product.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        await docRef.set({
          ...product,
          createdAt: new Date(),
        });
        console.log(`✅ Added product: ${product.name}`);
      } else {
        console.log(`⚡ Skipped: ${product.name} already exists`);
      }
    }

    console.log("🎉 Seeding finished!");
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
}

seedProducts().catch((err) => {
  console.error("❌ Error seeding products:", err);
  process.exit(1);
});