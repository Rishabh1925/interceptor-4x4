import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create client only if credentials are available
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Database schema types
export interface VideoAnalysis {
  id?: string
  filename: string
  file_size: number
  prediction: 'real' | 'fake'
  confidence: number
  models_used: string[]
  processing_time: number
  analysis_result: any
  created_at?: string
  user_ip?: string
}

// Check if file was previously analyzed
export async function checkDuplicateFile(filename: string, fileSize: number) {
  if (!supabase) return null
  
  try {
    const { data, error } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('filename', filename)
      .eq('file_size', fileSize)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error checking duplicate file:', error)
    return null
  }
}

// Analytics functions
export async function saveAnalysis(analysis: VideoAnalysis) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping save')
    return null
  }
  
  try {
    const { data, error } = await supabase
      .from('video_analyses')
      .insert([analysis])
      .select()
    
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error saving analysis:', error)
    throw error
  }
}

export async function getAnalyticsStats() {
  if (!supabase) {
    return {
      totalAnalyses: 0,
      fakeDetected: 0,
      realDetected: 0,
      recentAnalyses: 0,
      averageConfidence: 0
    }
  }
  
  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('video_analyses')
      .select('*', { count: 'exact', head: true })
    
    if (countError) throw countError
    
    // Get fake vs real breakdown
    const { data: breakdown, error: breakdownError } = await supabase
      .from('video_analyses')
      .select('prediction')
    
    if (breakdownError) throw breakdownError
    
    const fakeCount = breakdown?.filter(item => item.prediction === 'fake').length || 0
    const realCount = breakdown?.filter(item => item.prediction === 'real').length || 0
    
    // Get recent analyses (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentCount, error: recentError } = await supabase
      .from('video_analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
    
    if (recentError) throw recentError
    
    // Get average confidence
    const { data: confidenceData, error: confidenceError } = await supabase
      .from('video_analyses')
      .select('confidence')
    
    if (confidenceError) throw confidenceError
    
    const avgConfidence = confidenceData?.length 
      ? confidenceData.reduce((sum, item) => sum + item.confidence, 0) / confidenceData.length
      : 0
    
    return {
      totalAnalyses: totalCount || 0,
      fakeDetected: fakeCount,
      realDetected: realCount,
      recentAnalyses: recentCount || 0,
      averageConfidence: Math.round(avgConfidence * 100) / 100
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return {
      totalAnalyses: 0,
      fakeDetected: 0,
      realDetected: 0,
      recentAnalyses: 0,
      averageConfidence: 0
    }
  }
}

export async function getRecentAnalyses(limit = 10, offset = 0, filter: 'all' | 'real' | 'fake' = 'all') {
  if (!supabase) return { data: [], hasMore: false }
  
  try {
    let query = supabase
      .from('video_analyses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (filter !== 'all') {
      query = query.eq('prediction', filter)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return { 
      data: data || [], 
      hasMore: (count || 0) > offset + limit,
      total: count || 0 
    }
  } catch (error) {
    console.error('Error fetching recent analyses:', error)
    return { data: [], hasMore: false, total: 0 }
  }
}

// Get single analysis by ID
export async function getAnalysisById(id: string) {
  if (!supabase) return null
  
  try {
    const { data, error } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return null
  }
}

// Utility function to format relative time
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return date.toLocaleDateString()
}