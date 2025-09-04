import { adminDb as db } from './firebase-admin';

// Generate unique affiliate code for a user
export async function generateAffiliateCode(uid, email) {
  try {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    // ensure uniqueness
    const existingCode = await db
      .collection('affiliates')
      .where('code', '==', code)
      .get();

    if (!existingCode.empty) {
      return generateAffiliateCode(uid, email);
    }

    // ✅ store the full catalog link with the real code
    const link = `https://studentai.in/products?ref=${code}`;

    const affiliateData = {
      uid,
      email,
      code,
      link, // full link
      createdAt: new Date(),
      isActive: true,
      totalCommissions: 0,
      totalOrders: 0,
    };

    await db.collection('affiliates').doc(uid).set(affiliateData);

    return affiliateData;
  } catch (error) {
    console.error('Error generating affiliate code:', error);
    throw error;
  }
}

// Get affiliate data by UID
export async function getAffiliateData(uid) {
  try {
    const doc = await db.collection('affiliates').doc(uid).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting affiliate data:', error);
    throw error;
  }
}

// Get orders referred by affiliate code
export async function getAffiliateOrders(affiliateCode) {
  try {
    // Note: requires composite index on (affiliateCode ASC, createdAt DESC)
    const orders = await db
      .collection('orders')
      .where('affiliateCode', '==', affiliateCode)
      .orderBy('createdAt', 'desc')
      .get();

    return orders.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting affiliate orders:', error);
    throw error;
  }
}

// Calculate commission summary
export async function calculateCommission(affiliateCode) {
  try {
    const orders = await getAffiliateOrders(affiliateCode);

    const totalCommission = orders.reduce((sum, order) => {
      const commission = (order.total || 0) * 0.1; // 10%
      return sum + commission;
    }, 0);

    return {
      totalCommission,
      totalOrders: orders.length,
      orders,
    };
  } catch (error) {
    console.error('Error calculating commission:', error);
    throw error;
  }
}

// Update affiliate stats when new order is placed
export async function updateAffiliateStats(affiliateCode, orderTotal) {
  try {
    const affiliateRef = db.collection('affiliates');
    const affiliateQuery = await affiliateRef.where('code', '==', affiliateCode).get();

    if (!affiliateQuery.empty) {
      const affiliateDoc = affiliateQuery.docs[0];
      const commission = (orderTotal || 0) * 0.1;

      await affiliateRef.doc(affiliateDoc.id).update({
        totalCommissions: (affiliateDoc.data().totalCommissions || 0) + commission,
        totalOrders: (affiliateDoc.data().totalOrders || 0) + 1,
      });
    }
  } catch (error) {
    console.error('Error updating affiliate stats:', error);
    throw error;
  }
}

// Delete affiliate record
export async function deleteAffiliate(uid) {
  try {
    await db.collection('affiliates').doc(uid).delete();
    return true;
  } catch (error) {
    console.error('Error deleting affiliate:', error);
    throw error;
  }
}
