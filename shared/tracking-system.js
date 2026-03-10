// ===== نظام تتبع التذاكر المتقدم =====

class TrackingSystem {
    constructor() {
        this.tickets = [];
        this.listeners = [];
    }

    // إنشاء مسار تتبع جديد
    async createTracking(ticketId, stage, comment = '') {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // الحصول على التذكرة
            const ticketDoc = await db.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) return;

            const ticket = ticketDoc.data();

            // حساب وقت المرحلة
            const now = new Date();

            // إضافة المرحلة
            await db.collection('tracking').add({
                ticketId: ticketId,
                ticketNumber: ticket.ticketNumber,
                stage: stage,
                comment: comment,
                startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
                updatedByName: user.displayName || 'مستخدم',
                duration: 0
            });

            // تحديث وقت التذكرة
            await db.collection('tickets').doc(ticketId).update({
                currentStage: stage,
                lastStageUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                stageHistory: firebase.firestore.FieldValue.arrayUnion({
                    stage: stage,
                    timestamp: now,
                    by: user.uid
                })
            });

            // تسجيل النشاط
            await logActivity('tracking_created', {
                ticketId,
                stage,
                ticketNumber: ticket.ticketNumber
            });

            return true;

        } catch (error) {
            console.error('Error creating tracking:', error);
            return false;
        }
    }

    // تحديث مدة المرحلة
    async updateStageDuration(stageId) {
        try {
            const stageDoc = await db.collection('tracking').doc(stageId).get();
            if (!stageDoc.exists) return;

            const stage = stageDoc.data();
            const startedAt = stage.startedAt.toDate();
            const now = new Date();
            const duration = Math.round((now - startedAt) / 1000 / 60); // دقائق

            await db.collection('tracking').doc(stageId).update({
                duration: duration,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return duration;

        } catch (error) {
            console.error('Error updating stage duration:', error);
            return 0;
        }
    }

    // الحصول على مسار تتبع التذكرة
    async getTicketTracking(ticketId) {
        try {
            const snapshot = await db.collection('tracking')
                .where('ticketId', '==', ticketId)
                .orderBy('startedAt', 'asc')
                .get();

            const tracking = [];
            snapshot.forEach(doc => {
                tracking.push({ id: doc.id, ...doc.data() });
            });

            return tracking;

        } catch (error) {
            console.error('Error getting tracking:', error);
            return [];
        }
    }

    // تحليل أداء التذكرة
    async analyzeTicketPerformance(ticketId) {
        try {
            const tracking = await this.getTicketTracking(ticketId);
            
            let totalDuration = 0;
            let delays = [];

            tracking.forEach((stage, index) => {
                if (stage.duration) {
                    totalDuration += stage.duration;

                    // الكشف عن التأخير (أكثر من ساعتين)
                    if (stage.duration > 120) {
                        delays.push({
                            stage: stage.stage,
                            duration: stage.duration,
                            comment: stage.comment
                        });
                    }
                }
            });

            return {
                totalDuration,
                stagesCount: tracking.length,
                delays,
                hasDelay: delays.length > 0
            };

        } catch (error) {
            console.error('Error analyzing performance:', error);
            return null;
        }
    }

    // تحليل أداء الفريق
    async analyzeTeamPerformance(startDate, endDate) {
        try {
            const snapshot = await db.collection('tracking')
                .where('startedAt', '>=', startDate)
                .where('startedAt', '<=', endDate)
                .get();

            const performance = {
                totalStages: 0,
                totalDuration: 0,
                byUser: {},
                byStage: {}
            };

            snapshot.forEach(doc => {
                const stage = doc.data();
                performance.totalStages++;

                if (stage.duration) {
                    performance.totalDuration += stage.duration;
                }

                // حسب المستخدم
                if (!performance.byUser[stage.updatedByName]) {
                    performance.byUser[stage.updatedByName] = {
                        count: 0,
                        duration: 0
                    };
                }
                performance.byUser[stage.updatedByName].count++;
                performance.byUser[stage.updatedByName].duration += stage.duration || 0;

                // حسب المرحلة
                if (!performance.byStage[stage.stage]) {
                    performance.byStage[stage.stage] = {
                        count: 0,
                        duration: 0
                    };
                }
                performance.byStage[stage.stage].count++;
                performance.byStage[stage.stage].duration += stage.duration || 0;
            });

            return performance;

        } catch (error) {
            console.error('Error analyzing team performance:', error);
            return null;
        }
    }

    // إنشاء تقرير زمني
    async generateTimelineReport(ticketId) {
        const tracking = await this.getTicketTracking(ticketId);
        
        let html = '<div class="timeline">';
        let previousTime = null;

        tracking.forEach((stage, index) => {
            const startedAt = stage.startedAt ? 
                stage.startedAt.toDate().toLocaleString('ar-EG') : '-';
            
            let delay = '';
            if (previousTime && stage.startedAt) {
                const diff = (stage.startedAt.toDate() - previousTime) / 60000;
                if (diff > 120) {
                    delay = `<span class="delay-badge">⏰ تأخير ${Math.round(diff)} دقيقة</span>`;
                }
            }

            html += `
                <div class="timeline-item ${stage.duration > 120 ? 'delayed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-stage">${stage.stage}</span>
                            <span class="timeline-time">${startedAt}</span>
                        </div>
                        ${stage.comment ? `<div class="timeline-comment">${stage.comment}</div>` : ''}
                        <div class="timeline-footer">
                            <span>بواسطة: ${stage.updatedByName}</span>
                            ${stage.duration ? `<span>المدة: ${stage.duration} دقيقة</span>` : ''}
                            ${delay}
                        </div>
                    </div>
                </div>
            `;

            if (stage.startedAt) {
                previousTime = stage.startedAt.toDate();
            }
        });

        html += '</div>';
        return html;
    }

    // إضافة مستمع للتغييرات
    addListener(callback) {
        this.listeners.push(callback);
    }

    // إزالة مستمع
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }
}

// تهيئة النظام
const trackingSystem = new TrackingSystem();
