import { createClient } from '@supabase/supabase-js'

// Your Supabase project configuration
export const supabaseUrl = 'https://emvwmwdsaakdnweyhmki.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    storageKey: 'supabase.auth.token',
  }
})

// Database table schema for campaigns
export const CAMPAIGNS_TABLE = 'campaigns'

// Authentication service
export const authService = {
  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Sign up with email and password
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Sign in with email and password
  async signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },



  // Reset password
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Campaign database operations
export const campaignService = {
  // Get all campaigns for current user
  async getAllCampaigns() {
    const { data, error } = await supabase
      .from(CAMPAIGNS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create a new campaign
  async createCampaign(campaign) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from(CAMPAIGNS_TABLE)
      .insert([{
        user_id: user.id,
        name: campaign.name,
        url: campaign.url,
        impression_pixel: campaign.impression_pixel,
        click_pixel: campaign.click_pixel,
        tags: campaign.tags,
        description: campaign.description,
        product_description: campaign.product_description,
        target_audience: campaign.target_audience,
        rss_categories: campaign.rssCategories,
        rss_countries: campaign.rssCountries,
        job_id: campaign.job_id,
        job_status: campaign.job_status,
        job_submitted_at: campaign.job_submitted_at
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update an existing campaign
  async updateCampaign(id, campaign) {
    const { data, error } = await supabase
      .from(CAMPAIGNS_TABLE)
      .update({
        name: campaign.name,
        url: campaign.url,
        impression_pixel: campaign.impression_pixel,
        click_pixel: campaign.click_pixel,
        tags: campaign.tags,
        description: campaign.description,
        product_description: campaign.product_description,
        target_audience: campaign.target_audience,
        rss_categories: campaign.rssCategories,
        rss_countries: campaign.rssCountries,
        get_updates: campaign.get_updates,
        updates_hour: campaign.updates_hour,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a campaign
  async deleteCampaign(id) {
    const { error } = await supabase
      .from(CAMPAIGNS_TABLE)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Submit URL for analysis and get job ID
  async submitAnalysisJob(url) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('User must be authenticated')

    const response = await fetch(
      `${supabaseUrl}/functions/v1/analyze-url`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to submit analysis job')
    }

    return await response.json()
  },

  // Check job status
  async checkJobStatus(jobId) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('User must be authenticated')

    const response = await fetch(
      `${supabaseUrl}/functions/v1/check-job-status/${jobId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to check job status')
    }

    return await response.json()
  },

  // Update campaign job status
  async updateCampaignJobStatus(id, status, completedAt = null) {
    const updateData = {
      job_status: status,
      updated_at: new Date().toISOString()
    }
    
    if (completedAt) {
      updateData.job_completed_at = completedAt
    }

    const { data, error } = await supabase
      .from(CAMPAIGNS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}