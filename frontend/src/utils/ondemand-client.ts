/**
 * OnDemand.io API Client
 * Handles authentication and API calls to OnDemand agents
 */

export interface OnDemandConfig {
  organizationId: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  agentId: string;
  executionTime: number;
}

export class OnDemandClient {
  private config: OnDemandConfig;
  private baseUrl: string;

  constructor(config: OnDemandConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://app.on-demand.io/api';
  }

  /**
   * Execute an agent with given input
   * Try multiple authentication methods
   */
  async executeAgent(agentId: string, input: any): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Try different API endpoint patterns
      const endpoints = [
        `${this.baseUrl}/agents/${agentId}/execute`,
        `${this.baseUrl}/v1/agents/${agentId}/run`,
        `https://api.on-demand.io/agents/${agentId}/execute`,
        `https://app.on-demand.io/api/agents/${agentId}/execute`
      ];

      for (const endpoint of endpoints) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          // Try different authentication methods
          if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          }
          
          if (this.config.organizationId) {
            headers['X-Organization-ID'] = this.config.organizationId;
            headers['Organization-ID'] = this.config.organizationId;
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(input)
          });

          if (response.ok) {
            const data = await response.json();
            return {
              success: true,
              data,
              agentId,
              executionTime: Date.now() - startTime
            };
          }

          // If we get a 401/403, try next endpoint
          if (response.status === 401 || response.status === 403) {
            continue;
          }

          // For other errors, log and continue
          console.warn(`Endpoint ${endpoint} failed with status ${response.status}`);
        } catch (endpointError) {
          console.warn(`Endpoint ${endpoint} failed:`, endpointError);
          continue;
        }
      }

      throw new Error('All API endpoints failed');
    } catch (error) {
      console.error(`OnDemand agent ${agentId} execution failed:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        agentId,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test connection to OnDemand API
   */
  async testConnection(): Promise<{ success: boolean; method?: string; endpoint?: string }> {
    const testEndpoints = [
      'https://app.on-demand.io/api/health',
      'https://api.on-demand.io/health',
      'https://app.on-demand.io/api/agents',
      'https://api.on-demand.io/agents'
    ];

    for (const endpoint of testEndpoints) {
      try {
        const headers: Record<string, string> = {};
        
        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        
        if (this.config.organizationId) {
          headers['X-Organization-ID'] = this.config.organizationId;
        }

        const response = await fetch(endpoint, { headers });
        
        if (response.ok) {
          return { 
            success: true, 
            method: this.config.apiKey ? 'API Key' : 'Organization ID',
            endpoint 
          };
        }
      } catch (error) {
        continue;
      }
    }
    
    return { success: false };
  }
}

// Create singleton instance
let onDemandClient: OnDemandClient | null = null;

export function getOnDemandClient(): OnDemandClient {
  if (!onDemandClient) {
    const config: OnDemandConfig = {
      organizationId: process.env.ONDEMAND_ORGANIZATION_ID || '696e5c1c994f1554f9f957fa',
      apiKey: process.env.ONDEMAND_API_KEY,
      baseUrl: process.env.ONDEMAND_BASE_URL
    };

    onDemandClient = new OnDemandClient(config);
  }

  return onDemandClient;
}