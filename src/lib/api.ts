// Define types that mirror Prisma types, but are used only in the frontend
export interface Profile {
  id: string
  email: string
  full_name?: string | null
  role: 'ADMIN' | 'USER'
  created_at: Date
  updated_at: Date
}

export interface Subscriber {
  id: string
  email: string
  phone?: string | null
  first_name?: string | null
  last_name?: string | null
  status: string
  whatsapp_opt_in: boolean
  created_at: Date
  updated_at: Date
  group_subscribers?: GroupSubscriber[]
}

export interface UserGroup {
  id: string
  name: string
  description?: string | null
  created_at: Date
  updated_at: Date
  _count?: { subscribers: number }
}

export interface GroupSubscriber {
  group_id: string
  subscriber_id: string
  created_at: Date
  group?: UserGroup
}

export interface Campaign {
  id: string
  name: string
  type: 'EMAIL' | 'WHATSAPP'
  subject: string | null
  content?: string | null
  template_id?: string | null
  whatsapp_template_id?: string | null
  group_id: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'
  scheduled_at: Date | null
  sent_at: Date | null
  created_at: Date
  updated_at: Date
  created_by: string
  group?: UserGroup
  email_template?: any
  whatsapp_template?: any
}

export interface CreateCampaignData {
  name: string
  type: 'EMAIL' | 'WHATSAPP'
  subject?: string | null
  content?: string | null
  template_id?: string | null
  whatsapp_template_id?: string | null
  group_id: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'
  scheduled_at?: Date | string | null
  created_by: string
}

// Base URL for API requests
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function for API requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    console.log(`API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`)
    if (options.body) {
      console.log('Request body:', options.body)
    }
    
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    })

    if (!res.ok) {
      let errorText: string
      try {
        // Try to parse as JSON first
        const errorJson = await res.json()
        errorText = errorJson.error || JSON.stringify(errorJson)
      } catch {
        // If not JSON, get as text
        errorText = await res.text()
      }
      
      console.error(`API Error (${res.status}): ${errorText}`)
      throw new Error(errorText || `${res.status}: ${res.statusText}`)
    }

    // For endpoints that don't return JSON
    if (res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json()
      console.log(`API Response: ${endpoint}`, data)
      return data
    }
    
    const textResponse = await res.text()
    console.log(`API Text Response: ${endpoint}`, textResponse)
    return textResponse as unknown as T
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error)
    throw error
  }
}

// Profile API
export const profileAPI = {
  async getById(userId: string): Promise<Profile | null> {
    try {
      return await fetchAPI<Profile | null>(`/profiles/${userId}`);
    } catch (error) {
      console.log('Error in getById:', error);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  },

  async create(data: {
    id: string
    email: string
    full_name?: string
    role?: 'ADMIN' | 'USER'
  }): Promise<Profile> {
    try {
      console.log('Creating profile with data:', data);
      return await fetchAPI<Profile>('/profiles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log('Error in create:', error);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  },

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    return fetchAPI<Profile>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// Subscriber API
export const subscriberAPI = {
  async getAll(): Promise<Subscriber[]> {
    return fetchAPI<Subscriber[]>('/subscribers')
  },

  async getById(id: string): Promise<Subscriber | null> {
    return fetchAPI<Subscriber | null>(`/subscribers/${id}`)
  },

  async create(data: {
    email: string
    phone?: string
    first_name?: string
    last_name?: string
    whatsapp_opt_in?: boolean
    status?: string
  }): Promise<Subscriber> {
    return fetchAPI<Subscriber>('/subscribers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Subscriber>): Promise<Subscriber> {
    return fetchAPI<Subscriber>(`/subscribers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return fetchAPI<void>(`/subscribers/${id}`, {
      method: 'DELETE',
    })
  },
}

// Group API
export const groupAPI = {
  async getAll(): Promise<UserGroup[]> {
    return fetchAPI<UserGroup[]>('/groups')
  },

  async getById(id: string): Promise<UserGroup | null> {
    return fetchAPI<UserGroup | null>(`/groups/${id}`)
  },
  async create(data: {
    name: string
    description?: string
    created_by: string
  }): Promise<UserGroup> {
    return fetchAPI<UserGroup>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<UserGroup>): Promise<UserGroup> {
    return fetchAPI<UserGroup>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return fetchAPI<void>(`/groups/${id}`, {
      method: 'DELETE',
    })
  },

  async addSubscriber(groupId: string, subscriberId: string): Promise<void> {
    return fetchAPI<void>(`/groups/${groupId}/subscribers/${subscriberId}`, {
      method: 'POST',
    })
  },

  async removeSubscriber(groupId: string, subscriberId: string): Promise<void> {
    return fetchAPI<void>(`/groups/${groupId}/subscribers/${subscriberId}`, {
      method: 'DELETE',
    })
  },
}

// Campaign API
export const campaignAPI = {
  async getAll(): Promise<Campaign[]> {
    return fetchAPI<Campaign[]>('/campaigns')
  },

  async getById(id: string): Promise<Campaign | null> {
    return fetchAPI<Campaign | null>(`/campaigns/${id}`)
  },
  
  async create(data: CreateCampaignData): Promise<Campaign> {
    return fetchAPI<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Campaign>): Promise<Campaign> {
    return fetchAPI<Campaign>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return fetchAPI<void>(`/campaigns/${id}`, {
      method: 'DELETE',
    })
  },
}
