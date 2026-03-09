// دوال إدارة التذاكر

// إنشاء تذكرة جديدة
async function createTicket(ticketData) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

    try {
        // إنشاء رقم تذكرة فريد
        const ticketNumber = generateTicketNumber();

        // إضافة بيانات إضافية
        const fullTicketData = {
            ...ticketData,
            ticketNumber: ticketNumber,
            status: 'open',
            createdBy: user.uid,
            createdByName: user.displayName || 'مستخدم',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            attachments: [],
            comments: [],
            tags: []
        };

        // حفظ التذكرة
        const docRef = await db.collection('tickets').add(fullTicketData);

        // إنشاء مسار التتبع
        await db.collection('ticketStatusLog').add({
            ticketId: docRef.id,
            ticketNumber: ticketNumber,
            stageName: 'تم استلام التذكرة',
            status: 'completed',
            order: 1,
            comment: 'تم استلام التذكرة بنجاح',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user.uid
        });

        return { success: true, ticketId: docRef.id, ticketNumber };

    } catch (error) {
        console.error('Create ticket error:', error);
        return { success: false, error: error.message };
    }
}

// تحديث حالة التذكرة
async function updateTicketStatus(ticketId, newStatus, comment = '') {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

    try {
        // الحصول على التذكرة الحالية
        const ticketDoc = await db.collection('tickets').doc(ticketId).get();
        if (!ticketDoc.exists) {
            return { success: false, error: 'التذكرة غير موجودة' };
        }

        const ticket = ticketDoc.data();
        const oldStatus = ticket.status;

        // تحديث حالة التذكرة
        await db.collection('tickets').doc(ticketId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user.uid
        });

        // حساب رقم المرحلة التالي
        const stagesSnapshot = await db.collection('ticketStatusLog')
            .where('ticketId', '==', ticketId)
            .orderBy('order', 'desc')
            .limit(1)
            .get();

        let nextOrder = 1;
        if (!stagesSnapshot.empty) {
            nextOrder = stagesSnapshot.docs[0].data().order + 1;
        }

        // إضافة مرحلة جديدة
        await db.collection('ticketStatusLog').add({
            ticketId: ticketId,
            ticketNumber: ticket.ticketNumber,
            stageName: getStatusStageName(newStatus),
            status: newStatus === 'closed' ? 'completed' : 'active',
            order: nextOrder,
            comment: comment || `تم تغيير الحالة من ${oldStatus} إلى ${newStatus}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user.uid,
            updatedByName: user.displayName || 'مستخدم'
        });

        // إذا تم الإغلاق، إضافة مرحلة نهائية
        if (newStatus === 'closed') {
            await db.collection('ticketStatusLog').add({
                ticketId: ticketId,
                ticketNumber: ticket.ticketNumber,
                stageName: 'تم إغلاق التذكرة',
                status: 'completed',
                order: nextOrder + 1,
                comment: 'تم إغلاق التذكرة بنجاح',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid
            });
        }

        return { success: true };

    } catch (error) {
        console.error('Update ticket status error:', error);
        return { success: false, error: error.message };
    }
}

// تعيين مهندس للتذكرة
async function assignTicket(ticketId, engineerId, engineerName) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

    try {
        await db.collection('tickets').doc(ticketId).update({
            assignedTo: engineerId,
            assignedToName: engineerName,
            assignedBy: user.uid,
            assignedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // إضافة مرحلة التعيين
        await db.collection('ticketStatusLog').add({
            ticketId: ticketId,
            stageName: 'تم تعيين مهندس',
            status: 'completed',
            comment: `تم تعيين المهندس: ${engineerName}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user.uid
        });

        return { success: true };

    } catch (error) {
        console.error('Assign ticket error:', error);
        return { success: false, error: error.message };
    }
}

// إضافة تعليق على التذكرة
async function addTicketComment(ticketId, comment, isInternal = false) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'يجب تسجيل الدخول' };

    try {
        await db.collection('comments').add({
            ticketId: ticketId,
            content: comment,
            authorId: user.uid,
            authorName: user.displayName || 'مستخدم',
            authorRole: await getUserRole(user.uid),
            isInternal: isInternal,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            attachments: []
        });

        return { success: true };

    } catch (error) {
        console.error('Add comment error:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على تذاكر المستخدم
async function getUserTickets(userId, role, filters = {}) {
    try {
        let query = db.collection('tickets');

        if (role === 'engineer') {
            query = query.where('assignedTo', '==', userId);
        } else if (role === 'client') {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                query = query.where('clientEmail', '==', userDoc.data().email);
            }
        }

        // تطبيق الفلاتر
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }

        if (filters.priority) {
            query = query.where('priority', '==', filters.priority);
        }

        query = query.orderBy('createdAt', 'desc');

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const snapshot = await query.get();
        
        const tickets = [];
        snapshot.forEach(doc => {
            tickets.push({ id: doc.id, ...doc.data() });
        });

        return tickets;

    } catch (error) {
        console.error('Get user tickets error:', error);
        return [];
    }
}

// الحصول على مسار تتبع التذكرة
async function getTicketStages(ticketId) {
    try {
        const snapshot = await db.collection('ticketStatusLog')
            .where('ticketId', '==', ticketId)
            .orderBy('order', 'asc')
            .get();

        const stages = [];
        snapshot.forEach(doc => {
            stages.push({ id: doc.id, ...doc.data() });
        });

        return stages;

    } catch (error) {
        console.error('Get ticket stages error:', error);
        return [];
    }
}

// إنشاء رقم تذكرة فريد
function generateTicketNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TCK-${year}${month}${day}-${random}`;
}

// الحصول على اسم مرحلة الحالة
function getStatusStageName(status) {
    const stages = {
        'open': 'فتح التذكرة',
        'in-progress': 'بدأ العمل على التذكرة',
        'pending': 'معلقة بانتظار رد',
        'resolved': 'تم الحل',
        'closed': 'إغلاق التذكرة'
    };
    return stages[status] || status;
}

// الحصول على دور المستخدم
async function getUserRole(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        return doc.exists ? doc.data().role : 'unknown';
    } catch {
        return 'unknown';
    }
}
