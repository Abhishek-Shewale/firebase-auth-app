import { adminDb as db } from './firebase-admin';


// Generate unique affiliate code for a user
export async function generateAffiliateCode(uid, email) {
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const existingCode = await db.collection('affiliates')
        .where('code', '==', code)
        .get();
  
      if (!existingCode.empty) {
        return generateAffiliateCode(uid, email);
      }
  
      const link = `https://studentai.in/ai-course?ref=${code}`;
  
      const affiliateData = {
        uid,
        email,
        code,
        link,   // ✅ Save full link
        createdAt: new Date(),
        isActive: true,
        totalCommissions: 0,
        totalOrders: 0
      };
  
      await db.collection('affiliates').doc(uid).set(affiliateData);
  
      return affiliateData;
    } catch (error) {
      console.error('Error generating affiliate code:', error);
      throw error;
    }
  }
  

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

export async function getAffiliateOrders(affiliateCode) {
  try {
    const orders = await db.collection('orders')
      .where('affiliateCode', '==', affiliateCode)
      .orderBy('createdAt', 'desc')
      .get();

    return orders.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting affiliate orders:', error);
    throw error;
  }
}

export async function calculateCommission(affiliateCode) {
  try {
    const orders = await getAffiliateOrders(affiliateCode);

    const totalCommission = orders.reduce((sum, order) => {
      const commission = order.total * 0.10; // 10% commission
      return sum + commission;
    }, 0);

    return {
      totalCommission,
      totalOrders: orders.length,
      orders
    };
  } catch (error) {
    console.error('Error calculating commission:', error);
    throw error;
  }
}

export async function updateAffiliateStats(affiliateCode, orderTotal) {
  try {
    const affiliateRef = db.collection('affiliates');
    const affiliateQuery = await affiliateRef.where('code', '==', affiliateCode).get();

    if (!affiliateQuery.empty) {
      const affiliateDoc = affiliateQuery.docs[0];
      const commission = orderTotal * 0.10;

      await affiliateRef.doc(affiliateDoc.id).update({
        totalCommissions: affiliateDoc.data().totalCommissions + commission,
        totalOrders: affiliateDoc.data().totalOrders + 1
      });
    }
  } catch (error) {
    console.error('Error updating affiliate stats:', error);
    throw error;
  }
}

export async function deleteAffiliate(uid) {
  try {
    await db.collection('affiliates').doc(uid).delete();
    return true;
  } catch (error) {
    console.error('Error deleting affiliate:', error);
    throw error;
  }
}
