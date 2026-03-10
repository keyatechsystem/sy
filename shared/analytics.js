// ===== نظام التحليلات المتقدم =====

class AnalyticsSystem {
    constructor() {
        this.cache = {};
        this.reports = [];
    }

    // تحليل رضا العملاء
    async analyzeCustomerSatisfaction(period = 'month') {
        try {
            const startDate = this.getStartDate(period);
            
            const snapshot = await db.collection('tickets')
                .where('closedAt', '>=', startDate)
                .where('feedback', '!=', null)
                .get();

            let totalRating = 0;
            let ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            let comments = [];

            snapshot.forEach(doc => {
                const ticket = doc.data();
                if (ticket.feedback && ticket.feedback.rating) {
                    const rating = ticket.feedback.rating;
                    totalRating += rating;
                    ratings[rating]++;

                    if (ticket.feedback.comment) {
                        comments.push({
                            rating,
                            comment: ticket.feedback.comment,
                            date: ticket.closedAt
                        });
                    }
                }
            });

            const averageRating = snapshot.size > 0 ? 
                (totalRating / snapshot.size).toFixed(1) : 0;

            // تحليل المشاعر
            const sentiment = this.analyzeSentiment(comments);

            return {
                period,
                totalFeedbacks: snapshot.size,
                averageRating,
                ratings,
                sentiment,
                comments: comments.slice(0, 10)
            };

        } catch (error) {
            console.error('Error analyzing satisfaction:', error);
            return null;
        }
    }

    // تحليل المشاعر من التعليقات
    analyzeSentiment(comments) {
        const positiveWords = ['ممتاز', 'شكراً', 'رائع', 'ممتازة', 'سريع', 'محترم'];
        const negativeWords = ['سيء', 'بطيء', 'متأخر', 'مشكلة', 'خطأ', 'غير'];

        let positive = 0;
        let negative = 0;
        let neutral = 0;

        comments.forEach(item => {
            const comment = item.comment || '';
            let posCount = 0;
            let negCount = 0;

            positiveWords.forEach(word => {
                if (comment.includes(word)) posCount++;
            });

            negativeWords.forEach(word => {
                if (comment.includes(word)) negCount++;
            });

            if (posCount > negCount) positive++;
            else if (negCount > posCount) negative++;
            else neutral++;
        });

        const total = comments.length || 1;
        return {
            positive: Math.round((positive / total) * 100),
            negative: Math.round((negative / total) * 100),
            neutral: Math.round((neutral / total) * 100)
        };
    }

    // تحليل أداء الفريق
    async analyzeTeamPerformance(period = 'month') {
        try {
            const startDate = this.getStartDate(period);
            
            const snapshot = await db.collection('tickets')
                .where('closedAt', '>=', startDate)
                .get();

            const performance = {};

            snapshot.forEach(doc => {
                const ticket = doc.data();
                if (ticket.assignedToName) {
                    if (!performance[ticket.assignedToName]) {
                        performance[ticket.assignedToName] = {
                            completed: 0,
                            totalDuration: 0,
                            ratings: []
                        };
                    }

                    performance[ticket.assignedToName].completed++;

                    if (ticket.closedAt && ticket.createdAt) {
                        const duration = (ticket.closedAt.toDate() - ticket.createdAt.toDate()) / (1000 * 60 * 60);
                        performance[ticket.assignedToName].totalDuration += duration;
                    }

                    if (ticket.feedback && ticket.feedback.rating) {
                        performance[ticket.assignedToName].ratings.push(ticket.feedback.rating);
                    }
                }
            });

            // حساب المتوسطات
            Object.keys(performance).forEach(name => {
                const p = performance[name];
                p.averageDuration = p.completed > 0 ? 
                    (p.totalDuration / p.completed).toFixed(1) : 0;
                p.averageRating = p.ratings.length > 0 ? 
                    (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length).toFixed(1) : 0;
            });

            return performance;

        } catch (error) {
            console.error('Error analyzing team performance:', error);
            return null;
        }
    }

    // تحليل التذاكر
    async analyzeTickets(period = 'month') {
        try {
            const startDate = this.getStartDate(period);
            
            const snapshot = await db.collection('tickets')
                .where('createdAt', '>=', startDate)
                .get();

            const analysis = {
                total: 0,
                byStatus: { open: 0, 'in-progress': 0, closed: 0 },
                byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
                byDay: {},
                byHour: Array(24).fill(0),
                averageResolution: 0,
                totalResolutionTime: 0
            };

            snapshot.forEach(doc => {
                const ticket = doc.data();
                analysis.total++;

                // حسب الحالة
                analysis.byStatus[ticket.status || 'open']++;

                // حسب الأولوية
                analysis.byPriority[ticket.priority || 'medium']++;

                // حسب اليوم
                if (ticket.createdAt) {
                    const date = ticket.createdAt.toDate().toLocaleDateString('ar-EG');
                    analysis.byDay[date] = (analysis.byDay[date] || 0) + 1;

                    // حسب الساعة
                    const hour = ticket.createdAt.toDate().getHours();
                    analysis.byHour[hour]++;

                    // وقت الحل
                    if (ticket.status === 'closed' && ticket.closedAt) {
                        const duration = (ticket.closedAt.toDate() - ticket.createdAt.toDate()) / (1000 * 60 * 60);
                        analysis.totalResolutionTime += duration;
                    }
                }
            });

            analysis.averageResolution = analysis.byStatus.closed > 0 ? 
                (analysis.totalResolutionTime / analysis.byStatus.closed).toFixed(1) : 0;

            return analysis;

        } catch (error) {
            console.error('Error analyzing tickets:', error);
            return null;
        }
    }

    // تحليل العملاء
    async analyzeClients(period = 'month') {
        try {
            const startDate = this.getStartDate(period);
            
            const snapshot = await db.collection('tickets')
                .where('createdAt', '>=', startDate)
                .get();

            const clients = {};

            snapshot.forEach(doc => {
                const ticket = doc.data();
                const email = ticket.clientEmail;

                if (!clients[email]) {
                    clients[email] = {
                        name: ticket.clientName,
                        email: email,
                        tickets: 0,
                        resolved: 0,
                        lastTicket: null,
                        totalRating: 0,
                        ratings: 0
                    };
                }

                clients[email].tickets++;
                if (ticket.status === 'closed') clients[email].resolved++;

                if (!clients[email].lastTicket || 
                    (ticket.createdAt && ticket.createdAt.toDate() > clients[email].lastTicket)) {
                    clients[email].lastTicket = ticket.createdAt ? 
                        ticket.createdAt.toDate() : null;
                }

                if (ticket.feedback && ticket.feedback.rating) {
                    clients[email].totalRating += ticket.feedback.rating;
                    clients[email].ratings++;
                }
            });

            // تحويل إلى مصفوفة
            const clientsArray = Object.values(clients);
            
            // حساب متوسط التقييم
            clientsArray.forEach(c => {
                c.averageRating = c.ratings > 0 ? 
                    (c.totalRating / c.ratings).toFixed(1) : 0;
            });

            return {
                total: clientsArray.length,
                active: clientsArray.filter(c => 
                    c.lastTicket && (new Date() - c.lastTicket) < 30 * 24 * 60 * 60 * 1000
                ).length,
                topClients: clientsArray
                    .sort((a, b) => b.tickets - a.tickets)
                    .slice(0, 10),
                satisfiedClients: clientsArray
                    .filter(c => c.averageRating >= 4)
                    .length
            };

        } catch (error) {
            console.error('Error analyzing clients:', error);
            return null;
        }
    }

    // الحصول على تاريخ البداية
    getStartDate(period) {
        const now = new Date();
        switch(period) {
            case 'day':
                now.setHours(0, 0, 0, 0);
                return now;
            case 'week':
                now.setDate(now.getDate() - 7);
                return now;
            case 'month':
                now.setMonth(now.getMonth() - 1);
                return now;
            case 'year':
                now.setFullYear(now.getFullYear() - 1);
                return now;
            default:
                now.setMonth(now.getMonth() - 1);
                return now;
        }
    }

    // إنشاء تقرير كامل
    async generateFullReport(period = 'month') {
        try {
            const [
                satisfaction,
                teamPerformance,
                ticketsAnalysis,
                clientsAnalysis
            ] = await Promise.all([
                this.analyzeCustomerSatisfaction(period),
                this.analyzeTeamPerformance(period),
                this.analyzeTickets(period),
                this.analyzeClients(period)
            ]);

            const report = {
                generatedAt: new Date(),
                period,
                satisfaction,
                teamPerformance,
                ticketsAnalysis,
                clientsAnalysis,
                summary: this.generateSummary({
                    satisfaction,
                    teamPerformance,
                    ticketsAnalysis,
                    clientsAnalysis
                })
            };

            // حفظ التقرير
            await this.saveReport(report);

            return report;

        } catch (error) {
            console.error('Error generating report:', error);
            return null;
        }
    }

    // إنشاء ملخص
    generateSummary(data) {
        const summary = [];

        if (data.satisfaction) {
            summary.push({
                metric: 'رضا العملاء',
                value: `${data.satisfaction.averageRating} / 5`,
                trend: data.satisfaction.averageRating >= 4 ? 'جيد' : 'بحاجة تحسين'
            });
        }

        if (data.ticketsAnalysis) {
            summary.push({
                metric: 'متوسط وقت الحل',
                value: `${data.ticketsAnalysis.averageResolution} ساعة`,
                trend: data.ticketsAnalysis.averageResolution <= 24 ? 'جيد' : 'بحاجة تحسين'
            });

            summary.push({
                metric: 'نسبة الإنجاز',
                value: `${Math.round((data.ticketsAnalysis.byStatus.closed / data.ticketsAnalysis.total) * 100)}%`,
                trend: 'مستمر'
            });
        }

        if (data.clientsAnalysis) {
            summary.push({
                metric: 'العملاء النشطين',
                value: data.clientsAnalysis.active,
                trend: 'مستمر'
            });
        }

        return summary;
    }

    // حفظ التقرير
    async saveReport(report) {
        try {
            await db.collection('reports').add({
                ...report,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.reports.push(report);

        } catch (error) {
            console.error('Error saving report:', error);
        }
    }

    // الحصول على التقارير السابقة
    async getPreviousReports(limit = 10) {
        try {
            const snapshot = await db.collection('reports')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const reports = [];
            snapshot.forEach(doc => {
                reports.push({ id: doc.id, ...doc.data() });
            });

            return reports;

        } catch (error) {
            console.error('Error getting reports:', error);
            return [];
        }
    }
}

// تهيئة النظام
const analyticsSystem = new AnalyticsSystem();
