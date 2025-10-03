import { createClient } from '@supabase/supabase-js'

// Your Supabase project configuration
const supabaseUrl = 'https://emvwmwdsaakdnweyhmki.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
      .order('updated_at', { ascending: false })
    
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
        tags: campaign.tags,
        description: campaign.description,
        product_description: campaign.product_description,
        rss_categories: campaign.rssCategories,
        rss_countries: campaign.rssCountries
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
        tags: campaign.tags,
        description: campaign.description,
        product_description: campaign.product_description,
        rss_categories: campaign.rssCategories,
        rss_countries: campaign.rssCountries,
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
  }
}