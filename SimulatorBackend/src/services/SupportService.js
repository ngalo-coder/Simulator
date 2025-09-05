import mongoose from 'mongoose';
import User from '../models/UserModel.js';
import emailService from './emailService.js';

/**
 * Support Service
 * Provides help desk, communication, and support system functionality
 */
class SupportService {
  constructor() {
    this.ticketPriorities = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.ticketStatuses = {
      OPEN: 'open',
      IN_PROGRESS: 'in_progress',
      RESOLVED: 'resolved',
      CLOSED: 'closed'
    };

    this.ticketCategories = {
      TECHNICAL: 'technical',
      ACADEMIC: 'academic',
      BILLING: 'billing',
      FEATURE_REQUEST: 'feature_request',
      BUG_REPORT: 'bug_report',
      OTHER: 'other'
    };

    this.forumCategories = {
      GENERAL: 'general',
      CASE_DISCUSSION: 'case_discussion',
      STUDY_GROUPS: 'study_groups',
      TECHNICAL_HELP: 'technical_help',
      CAREER_ADVICE: 'career_advice'
    };

    this.emergencyLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * Create a new support ticket
   * @param {Object} user - User creating the ticket
   * @param {Object} ticketData - Ticket data
   * @returns {Promise<Object>} - Created ticket
   */
  async createSupportTicket(user, ticketData) {
    try {
      const ticket = {
        ticketNumber: await this.generateTicketNumber(),
        userId: user._id,
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category || this.ticketCategories.TECHNICAL,
        priority: this.determinePriority(ticketData),
        status: this.ticketStatuses.OPEN,
        attachments: ticketData.attachments || [],
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: this.calculateDueDate(ticketData.priority),
        metadata: {
            userAgent: ticketData.userAgent,
            browser: ticketData.browser,
            os: ticketData.os,
            url: ticketData.url
        }
      };

      const result = await mongoose.connection.db.collection('support_tickets').insertOne(ticket);
      
      // Notify support team
      await this.notifySupportTeam(ticket);
      
      // Send confirmation to user
      await this.sendTicketConfirmation(user, ticket);

      return {
        ...ticket,
        _id: result.insertedId
      };
    } catch (error) {
      console.error('Create support ticket error:', error);
      throw error;
    }
  }

  /**
   * Generate unique ticket number
   */
  async generateTicketNumber() {
    const count = await mongoose.connection.db.collection('support_tickets').countDocuments();
    return `TKT-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Determine ticket priority based on content and category
   */
  determinePriority(ticketData) {
    const urgentKeywords = ['crash', 'emergency', 'urgent', 'broken', 'not working', 'critical'];
    const title = ticketData.title.toLowerCase();
    const description = ticketData.description.toLowerCase();

    if (urgentKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return this.ticketPriorities.HIGH;
    }

    if (ticketData.category === this.ticketCategories.TECHNICAL) {
      return this.ticketPriorities.MEDIUM;
    }

    return this.ticketPriorities.LOW;
  }

  /**
   * Calculate due date based on priority
   */
  calculateDueDate(priority) {
    const dueDate = new Date();
    switch (priority) {
      case this.ticketPriorities.CRITICAL:
        dueDate.setHours(dueDate.getHours() + 4);
        break;
      case this.ticketPriorities.HIGH:
        dueDate.setDate(dueDate.getDate() + 1);
        break;
      case this.ticketPriorities.MEDIUM:
        dueDate.setDate(dueDate.getDate() + 3);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 7);
    }
    return dueDate;
  }

  /**
   * Notify support team about new ticket
   */
  async notifySupportTeam(ticket) {
    const supportTeam = await User.find({ roles: { $in: ['admin', 'support'] } });
    
    for (const member of supportTeam) {
      await emailService.sendEmail({
        to: member.email,
        subject: `New Support Ticket: ${ticket.ticketNumber}`,
        template: 'support-ticket-notification',
        context: {
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          priority: ticket.priority,
          category: ticket.category,
          dueDate: ticket.dueDate.toLocaleDateString()
        }
      });
    }
  }

  /**
   * Send ticket confirmation to user
   */
  async sendTicketConfirmation(user, ticket) {
    await emailService.sendEmail({
      to: user.email,
      subject: `Support Ticket Created: ${ticket.ticketNumber}`,
      template: 'ticket-confirmation',
      context: {
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        expectedResponse: this.getExpectedResponseTime(ticket.priority)
      }
    });
  }

  /**
   * Get expected response time based on priority
   */
  getExpectedResponseTime(priority) {
    switch (priority) {
      case this.ticketPriorities.CRITICAL:
        return 'within 4 hours';
      case this.ticketPriorities.HIGH:
        return 'within 24 hours';
      case this.ticketPriorities.MEDIUM:
        return 'within 3 business days';
      default:
        return 'within 7 business days';
    }
  }

  /**
   * Get user's support tickets
   * @param {Object} user - User object
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - User's tickets
   */
  async getUserTickets(user, filters = {}) {
    try {
      const query = { userId: user._id };
      
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }

      const tickets = await mongoose.connection.db.collection('support_tickets')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return tickets;
    } catch (error) {
      console.error('Get user tickets error:', error);
      throw error;
    }
  }

  /**
   * Update support ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} updates - Ticket updates
   * @param {Object} user - User making update
   * @returns {Promise<Object>} - Updated ticket
   */
  async updateTicket(ticketId, updates, user) {
    try {
      const ticket = await mongoose.connection.db.collection('support_tickets')
        .findOne({ _id: new mongoose.Types.ObjectId(ticketId) });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Check permissions
      if (!user.roles.includes('admin') && !user.roles.includes('support') && 
          ticket.userId.toString() !== user._id.toString()) {
        throw new Error('Unauthorized to update this ticket');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      if (updates.status === this.ticketStatuses.RESOLVED) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = user._id;
      }

      const result = await mongoose.connection.db.collection('support_tickets').updateOne(
        { _id: new mongoose.Types.ObjectId(ticketId) },
        { $set: updateData }
      );

      if (updates.status === this.ticketStatuses.RESOLVED) {
        await this.notifyTicketResolution(ticket, user);
      }

      return result;
    } catch (error) {
      console.error('Update ticket error:', error);
      throw error;
    }
  }

  /**
   * Notify user about ticket resolution
   */
  async notifyTicketResolution(ticket, resolvedBy) {
    const user = await User.findById(ticket.userId);
    
    await emailService.sendEmail({
      to: user.email,
      subject: `Ticket Resolved: ${ticket.ticketNumber}`,
      template: 'ticket-resolution',
      context: {
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        resolvedBy: resolvedBy.profile?.firstName || resolvedBy.username,
        resolutionDate: new Date().toLocaleDateString()
      }
    });
  }

  /**
   * Create forum post
   * @param {Object} user - User creating post
   * @param {Object} postData - Post data
   * @returns {Promise<Object>} - Created post
   */
  async createForumPost(user, postData) {
    try {
      const post = {
        title: postData.title,
        content: postData.content,
        authorId: user._id,
        authorName: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : user.username,
        category: postData.category || this.forumCategories.GENERAL,
        tags: postData.tags || [],
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        replyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date()
      };

      const result = await mongoose.connection.db.collection('forum_posts').insertOne(post);
      
      // Notify subscribers of new post in category
      await this.notifyForumSubscribers(post);

      return {
        ...post,
        _id: result.insertedId
      };
    } catch (error) {
      console.error('Create forum post error:', error);
      throw error;
    }
  }

  /**
   * Notify forum subscribers about new post
   */
  async notifyForumSubscribers(post) {
    const subscribers = await mongoose.connection.db.collection('forum_subscriptions')
      .find({ category: post.category, enabled: true })
      .toArray();

    for (const subscription of subscribers) {
      const user = await User.findById(subscription.userId);
      if (user && user._id.toString() !== post.authorId.toString()) {
        await emailService.sendEmail({
          to: user.email,
          subject: `New Forum Post in ${post.category}: ${post.title}`,
          template: 'forum-post-notification',
          context: {
            category: post.category,
            title: post.title,
            author: post.authorName,
            postUrl: `/forum/posts/${post._id}`
          }
        });
      }
    }
  }

  /**
   * Get forum posts with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Forum posts
   */
  async getForumPosts(filters = {}) {
    try {
      const {
        category = null,
        authorId = null,
        tags = [],
        search = '',
        page = 1,
        limit = 20,
        sortBy = 'lastActivity',
        sortOrder = 'desc'
      } = filters;

      const query = {};

      if (category) {
        query.category = category;
      }
      if (authorId) {
        query.authorId = new mongoose.Types.ObjectId(authorId);
      }
      if (tags.length > 0) {
        query.tags = { $in: tags };
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [posts, total] = await Promise.all([
        mongoose.connection.db.collection('forum_posts')
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        mongoose.connection.db.collection('forum_posts').countDocuments(query)
      ]);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get forum posts error:', error);
      throw error;
    }
  }

  /**
   * Create forum reply
   * @param {Object} user - User creating reply
   * @param {string} postId - Post ID
   * @param {Object} replyData - Reply data
   * @returns {Promise<Object>} - Created reply
   */
  async createForumReply(user, postId, replyData) {
    try {
      const post = await mongoose.connection.db.collection('forum_posts')
        .findOne({ _id: new mongoose.Types.ObjectId(postId) });

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.isLocked) {
        throw new Error('Post is locked and cannot be replied to');
      }

      const reply = {
        postId: new mongoose.Types.ObjectId(postId),
        content: replyData.content,
        authorId: user._id,
        authorName: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : user.username,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSolution: false
      };

      const result = await mongoose.connection.db.collection('forum_replies').insertOne(reply);

      // Update post activity and reply count
      await mongoose.connection.db.collection('forum_posts').updateOne(
        { _id: new mongoose.Types.ObjectId(postId) },
        {
          $set: { lastActivity: new Date() },
          $inc: { replyCount: 1 }
        }
      );

      // Notify post author about new reply
      if (post.authorId.toString() !== user._id.toString()) {
        await this.notifyPostAuthor(post, user, reply);
      }

      return {
        ...reply,
        _id: result.insertedId
      };
    } catch (error) {
      console.error('Create forum reply error:', error);
      throw error;
    }
  }

  /**
   * Notify post author about new reply
   */
  async notifyPostAuthor(post, replyAuthor, reply) {
    const author = await User.findById(post.authorId);
    
    if (author) {
      await emailService.sendEmail({
        to: author.email,
        subject: `New Reply to Your Post: ${post.title}`,
        template: 'forum-reply-notification',
        context: {
          postTitle: post.title,
          replyAuthor: replyAuthor.profile?.firstName || replyAuthor.username,
          replyPreview: reply.content.substring(0, 100) + '...',
          postUrl: `/forum/posts/${post._id}`
        }
      });
    }
  }

  /**
   * Schedule office hours with instructor
   * @param {Object} student - Student user
   * @param {Object} instructor - Instructor user
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} - Scheduled appointment
   */
  async scheduleOfficeHours(student, instructor, scheduleData) {
    try {
      // Check instructor availability
      const isAvailable = await this.checkInstructorAvailability(instructor._id, scheduleData.startTime, scheduleData.endTime);
      
      if (!isAvailable) {
        throw new Error('Instructor is not available at the requested time');
      }

      const appointment = {
        studentId: student._id,
        instructorId: instructor._id,
        title: scheduleData.title || 'Office Hours Appointment',
        description: scheduleData.description,
        startTime: new Date(scheduleData.startTime),
        endTime: new Date(scheduleData.endTime),
        duration: scheduleData.duration || 30,
        status: 'scheduled',
        meetingLink: this.generateMeetingLink(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await mongoose.connection.db.collection('office_hours').insertOne(appointment);

      // Send confirmation emails
      await this.sendAppointmentConfirmation(student, instructor, appointment);
      await this.sendAppointmentNotification(instructor, student, appointment);

      return {
        ...appointment,
        _id: result.insertedId
      };
    } catch (error) {
      console.error('Schedule office hours error:', error);
      throw error;
    }
  }

  /**
   * Check instructor availability
   */
  async checkInstructorAvailability(instructorId, startTime, endTime) {
    const conflictingAppointments = await mongoose.connection.db.collection('office_hours')
      .find({
        instructorId: instructorId,
        status: 'scheduled',
        $or: [
          { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
          { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } }
        ]
      })
      .toArray();

    return conflictingAppointments.length === 0;
  }

  /**
   * Generate meeting link (would integrate with video conferencing API)
   */
  generateMeetingLink() {
    // This would integrate with Zoom, Google Meet, etc.
    return `https://meet.example.com/${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Send appointment confirmation to student
   */
  async sendAppointmentConfirmation(student, instructor, appointment) {
    await emailService.sendEmail({
      to: student.email,
      subject: 'Office Hours Appointment Confirmed',
      template: 'appointment-confirmation',
      context: {
        instructorName: instructor.profile?.firstName ? `${instructor.profile.firstName} ${instructor.profile.lastName}` : instructor.username,
        date: appointment.startTime.toLocaleDateString(),
        time: appointment.startTime.toLocaleTimeString(),
        duration: appointment.duration,
        meetingLink: appointment.meetingLink
      }
    });
  }

  /**
   * Send appointment notification to instructor
   */
  async sendAppointmentNotification(instructor, student, appointment) {
    await emailService.sendEmail({
      to: instructor.email,
      subject: 'New Office Hours Appointment',
      template: 'appointment-notification',
      context: {
        studentName: student.profile?.firstName ? `${student.profile.firstName} ${student.profile.lastName}` : student.username,
        date: appointment.startTime.toLocaleDateString(),
        time: appointment.startTime.toLocaleTimeString(),
        duration: appointment.duration,
        meetingLink: appointment.meetingLink,
        description: appointment.description
      }
    });
  }

  /**
   * Handle emergency support request
   * @param {Object} user - User requesting emergency support
   * @param {Object} emergencyData - Emergency data
   * @returns {Promise<Object>} - Emergency response
   */
  async handleEmergencySupport(user, emergencyData) {
    try {
      const emergencyLevel = this.assessEmergencyLevel(emergencyData);
      
      const emergency = {
        userId: user._id,
        level: emergencyLevel,
        type: emergencyData.type,
        description: emergencyData.description,
        contactPreference: emergencyData.contactPreference,
        createdAt: new Date(),
        status: 'active',
        assignedTo: null
      };

      const result = await mongoose.connection.db.collection('emergency_support').insertOne(emergency);

      // Trigger emergency response protocol
      await this.triggerEmergencyProtocol(emergency, user);

      return {
        ...emergency,
        _id: result.insertedId,
        response: this.getEmergencyResponse(emergencyLevel)
      };
    } catch (error) {
      console.error('Handle emergency support error:', error);
      throw error;
    }
  }

  /**
   * Assess emergency level
   */
  assessEmergencyLevel(emergencyData) {
    const criticalKeywords = ['suicide', 'self-harm', 'violence', 'abuse', 'overdose'];
    const urgentKeywords = ['panic', 'anxiety', 'crisis', 'emergency', 'urgent'];

    const description = emergencyData.description.toLowerCase();

    if (criticalKeywords.some(keyword => description.includes(keyword))) {
      return this.emergencyLevels.CRITICAL;
    }

    if (urgentKeywords.some(keyword => description.includes(keyword))) {
      return this.emergencyLevels.HIGH;
    }

    return this.emergencyLevels.MEDIUM;
  }

  /**
   * Trigger emergency response protocol
   */
  async triggerEmergencyProtocol(emergency, user) {
    const emergencyTeam = await User.find({ 
      roles: { $in: ['admin', 'crisis'] },
      isAvailable: true
    });

    // Immediate notification for critical emergencies
    if (emergency.level === this.emergencyLevels.CRITICAL) {
      for (const member of emergencyTeam) {
        await this.sendEmergencyAlert(member, emergency, user);
      }
      
      // Also notify external emergency services if configured
      await this.notifyExternalEmergencyServices(emergency, user);
    } else {
      // Standard notification for other emergencies
      for (const member of emergencyTeam.slice(0, 2)) { // Notify first 2 available members
        await this.sendEmergencyNotification(member, emergency, user);
      }
    }

    // Send reassurance to user
    await this.sendEmergencyReassurance(user, emergency);
  }

  /**
   * Send emergency alert to team member
   */
  async sendEmergencyAlert(member, emergency, user) {
    await emailService.sendEmail({
      to: member.email,
      subject: '🚨 CRITICAL EMERGENCY ALERT 🚨',
      template: 'emergency-alert',
      context: {
        studentName: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : user.username,
        emergencyLevel: emergency.level,
        emergencyType: emergency.type,
        description: emergency.description,
        contactInfo: user.email
      }
    });

    // Would also integrate with SMS/push notifications here
  }

  /**
   * Notify external emergency services
   */
  async notifyExternalEmergencyServices(emergency, user) {
    // This would integrate with external emergency services API
    // For now, just log the need for external notification
    console.log('External emergency services notification required for:', {
      emergencyId: emergency._id,
      userId: user._id,
      level: emergency.level,
      type: emergency.type
    });
  }

  /**
   * Send emergency notification (non-critical)
   */
  async sendEmergencyNotification(member, emergency, user) {
    await emailService.sendEmail({
      to: member.email,
      subject: `Emergency Support Request: Level ${emergency.level.toUpperCase()}`,
      template: 'emergency-notification',
      context: {
        studentName: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : user.username,
        emergencyLevel: emergency.level,
        emergencyType: emergency.type,
        description: emergency.description,
        contactPreference: emergency.contactPreference
      }
    });
  }

  /**
   * Send reassurance to user
   */
  async sendEmergencyReassurance(user, emergency) {
    await emailService.sendEmail({
      to: user.email,
      subject: 'Emergency Support Request Received',
      template: 'emergency-reassurance',
      context: {
        emergencyLevel: emergency.level,
        expectedResponse: this.getEmergencyResponseTime(emergency.level),
        crisisResources: this.getCrisisResources()
      }
    });
  }

  /**
   * Get emergency response time expectation
   */
  getEmergencyResponseTime(level) {
    switch (level) {
      case this.emergencyLevels.CRITICAL:
        return 'Immediate response - within 15 minutes';
      case this.emergencyLevels.HIGH:
        return 'Urgent response - within 1 hour';
      case this.emergencyLevels.MEDIUM:
        return 'Priority response - within 4 hours';
      default:
        return 'Standard response - within 24 hours';
    }
  }

  /**
   * Get crisis resources information
   */
  getCrisisResources() {
    return [
      {
        name: 'National Suicide Prevention Lifeline',
        phone: '988',
        website: 'https://988lifeline.org',
        available: '24/7'
      },
      {
        name: 'Crisis Text Line',
        phone: 'Text HOME to 741741',
        website: 'https://www.crisistextline.org',
        available: '24/7'
      },
      {
        name: 'Emergency Services',
        phone: '911',
        available: '24/7'
      }
    ];
  }

  /**
   * Get emergency response message
   */
  getEmergencyResponse(level) {
    const responses = {
      [this.emergencyLevels.CRITICAL]: {
        message: 'Critical emergency detected. Immediate assistance has been alerted.',
        instructions: 'Please stay on the line and await contact from emergency services.',
        priority: 'highest'
      },
      [this.emergencyLevels.HIGH]: {
        message: 'High-priority emergency received. Crisis team has been notified.',
        instructions: 'A team member will contact you within the hour.',
        priority: 'high'
      },
      [this.emergencyLevels.MEDIUM]: {
        message: 'Emergency support request received.',
        instructions: 'A support team member will contact you within 4 hours.',
        priority: 'medium'
      },
      [this.emergencyLevels.LOW]: {
        message: 'Support request received.',
        instructions: 'A team member will respond within 24 hours.',
        priority: 'normal'
      }
    };

    return responses[level] || responses[this.emergencyLevels.MEDIUM];
  }

  /**
   * Get support statistics
   * @returns {Promise<Object>} - Support system statistics
   */
  async getSupportStatistics() {
    try {
      const [
        totalTickets,
        openTickets,
        resolvedTickets,
        totalPosts,
        totalReplies,
        activeEmergencies
      ] = await Promise.all([
        mongoose.connection.db.collection('support_tickets').countDocuments(),
        mongoose.connection.db.collection('support_tickets').countDocuments({ status: 'open' }),
        mongoose.connection.db.collection('support_tickets').countDocuments({ status: 'resolved' }),
        mongoose.connection.db.collection('forum_posts').countDocuments(),
        mongoose.connection.db.collection('forum_replies').countDocuments(),
        mongoose.connection.db.collection('emergency_support').countDocuments({ status: 'active' })
      ]);

      const avgResolutionTime = await this.calculateAverageResolutionTime();

      return {
        tickets: {
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets,
          resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets * 100).toFixed(1) : 0,
          averageResolutionTime: avgResolutionTime
        },
        forum: {
          totalPosts,
          totalReplies,
          averageRepliesPerPost: totalPosts > 0 ? (totalReplies / totalPosts).toFixed(1) : 0
        },
        emergencies: {
          active: activeEmergencies
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Get support statistics error:', error);
      throw error;
    }
  }

  /**
   * Calculate average ticket resolution time
   */
  async calculateAverageResolutionTime() {
    const resolvedTickets = await mongoose.connection.db.collection('support_tickets')
      .find({ status: 'resolved', resolvedAt: { $exists: true } })
      .toArray();

    if (resolvedTickets.length === 0) return 0;

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const resolutionTime = new Date(ticket.resolvedAt) - new Date(ticket.createdAt);
      return sum + resolutionTime;
    }, 0);

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // Hours
  }
}

export default new SupportService();