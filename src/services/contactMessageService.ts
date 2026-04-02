import { apiClient } from './apiClient';
import type { 
  ContactMessage, 
  ContactMessageCategory, 
  ContactMessageStatus, 
  ContactMessagePriority 
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateContactMessageData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category?: ContactMessageCategory;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export interface UpdateContactMessageData {
  status?: ContactMessageStatus;
  priority?: ContactMessagePriority;
  assignedTo?: string;
  adminNotes?: string;
}

export interface ContactMessageFilters {
  status?: ContactMessageStatus;
  category?: ContactMessageCategory;
  priority?: ContactMessagePriority;
  assignedTo?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CONTACT MESSAGE SERVICE
// ============================================================================

class ContactMessageService {
  private supabase = apiClient.supabase;

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Create Contact Message
  // --------------------------------------------------------------------------
  async createMessage(data: CreateContactMessageData) {
    try {
      const { data: message, error } = await this.supabase
        .from('contact_messages')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          category: data.category || 'general',
          user_id: data.userId,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          referrer: data.referrer,
          status: 'new',
          priority: 'normal',
          response_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return apiClient.createResponse<ContactMessage>(message, null);
    } catch (error: any) {
      return apiClient.createResponse<ContactMessage>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Message by ID
  // --------------------------------------------------------------------------
  async getMessageById(messageId: string) {
    try {
      const { data, error } = await this.supabase
        .from('contact_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (error) throw error;

      return apiClient.createResponse<ContactMessage>(data, null);
    } catch (error: any) {
      return apiClient.createResponse<ContactMessage>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get All Messages (Admin)
  // --------------------------------------------------------------------------
  async getAllMessages(filters?: ContactMessageFilters) {
    try {
      let query = this.supabase
        .from('contact_messages')
        .select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      query = query.order('created_at', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return apiClient.createResponse<ContactMessage[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<ContactMessage[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get User Messages
  // --------------------------------------------------------------------------
  async getUserMessages(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return apiClient.createResponse<ContactMessage[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<ContactMessage[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Update Message
  // --------------------------------------------------------------------------
  async updateMessage(messageId: string, data: UpdateContactMessageData) {
    try {
      const updateData: any = {};

      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
      if (data.adminNotes !== undefined) updateData.admin_notes = data.adminNotes;

      const { data: message, error } = await this.supabase
        .from('contact_messages')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      return apiClient.createResponse<ContactMessage>(message, null);
    } catch (error: any) {
      return apiClient.createResponse<ContactMessage>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Delete Message
  // --------------------------------------------------------------------------
  async deleteMessage(messageId: string) {
    try {
      const { error } = await this.supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // ==========================================================================
  // ADMIN OPERATIONS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Assign Message
  // --------------------------------------------------------------------------
  async assignMessage(messageId: string, adminId: string) {
    return this.updateMessage(messageId, {
      assignedTo: adminId,
      status: 'in_progress',
    });
  }

  // --------------------------------------------------------------------------
  // Mark as Responded
  // --------------------------------------------------------------------------
  async markAsResponded(messageId: string) {
    try {
      const { error } = await this.supabase
        .rpc('mark_contact_message_responded', {
          p_message_id: messageId,
          p_admin_id: (await this.supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // --------------------------------------------------------------------------
  // Resolve Message
  // --------------------------------------------------------------------------
  async resolveMessage(messageId: string, adminNotes?: string) {
    return this.updateMessage(messageId, {
      status: 'resolved',
      adminNotes,
    });
  }

  // --------------------------------------------------------------------------
  // Mark as Spam
  // --------------------------------------------------------------------------
  async markAsSpam(messageId: string) {
    return this.updateMessage(messageId, {
      status: 'spam',
    });
  }

  // ==========================================================================
  // STATS & SUMMARY
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Get Message Stats
  // --------------------------------------------------------------------------
  async getMessageStats() {
    try {
      const { data: newCount, error: newError } = await this.supabase
        .from('contact_messages')
        .select('count', { count: 'exact' })
        .eq('status', 'new');

      const { data: inProgressCount, error: progressError } = await this.supabase
        .from('contact_messages')
        .select('count', { count: 'exact' })
        .eq('status', 'in_progress');

      const { data: resolvedCount, error: resolvedError } = await this.supabase
        .from('contact_messages')
        .select('count', { count: 'exact' })
        .eq('status', 'resolved');

      const { data: urgentCount, error: urgentError } = await this.supabase
        .from('contact_messages')
        .select('count', { count: 'exact' })
        .eq('priority', 'urgent')
        .in('status', ['new', 'in_progress']);

      if (newError || progressError || resolvedError || urgentError) {
        throw newError || progressError || resolvedError || urgentError;
      }

      const stats = {
        new: newCount?.length || 0,
        in_progress: inProgressCount?.length || 0,
        resolved: resolvedCount?.length || 0,
        urgent: urgentCount?.length || 0,
      };

      return apiClient.createResponse(stats, null);
    } catch (error: any) {
      return apiClient.createResponse(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Unassigned Messages
  // --------------------------------------------------------------------------
  async getUnassignedMessages(limit: number = 20) {
    try {
      const { data, error } = await this.supabase
        .from('contact_messages')
        .select('*')
        .is('assigned_to', null)
        .in('status', ['new'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return apiClient.createResponse<ContactMessage[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<ContactMessage[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Messages by Assignee
  // --------------------------------------------------------------------------
  async getMessagesByAssignee(adminId: string, status?: ContactMessageStatus) {
    try {
      let query = this.supabase
        .from('contact_messages')
        .select('*')
        .eq('assigned_to', adminId);

      if (status) {
        query = query.eq('status', status);
      } else {
        query = query.in('status', ['new', 'in_progress', 'waiting_for_user']);
      }

      const { data, error } = await query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return apiClient.createResponse<ContactMessage[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<ContactMessage[]>(null, error);
    }
  }
}

// Singleton instance
const contactMessageService = new ContactMessageService();
export default contactMessageService;

// Export individual functions for convenience
export const {
  createMessage,
  getMessageById,
  getAllMessages,
  getUserMessages,
  updateMessage,
  deleteMessage,
  assignMessage,
  markAsResponded,
  resolveMessage,
  markAsSpam,
  getMessageStats,
  getUnassignedMessages,
  getMessagesByAssignee,
} = contactMessageService;
