/**
 * Operating Mode API Endpoint
 * 
 * Provides the current tenant's operating mode for client-side components.
 * This endpoint is used by the ModeBadge and other client components.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/server/auth';
import { getCurrentTenantId } from '@/services';
import { getTenantConfig } from '@/server/datastore';
import { getOperatingModeServer } from '@/lib/operating-mode-server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get tenant ID for the current user
    const tenantId = await getCurrentTenantId();
    
    // Get operating mode using server-side utility
    const operatingMode = await getOperatingModeServer();
    
    // Get tenant configuration for additional info
    let tenantConfig = null;
    if (tenantId) {
      tenantConfig = await getTenantConfig(tenantId);
    }

    return NextResponse.json({
      operatingMode,
      tenantId,
      features: tenantConfig?.features || {
        manualExport: true,
        patientManagement: true,
        ehrSync: false,
      },
    });

  } catch (error) {
    console.error('Error fetching operating mode:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        operatingMode: 'standalone', // Safe default
      }, 
      { status: 500 }
    );
  }
}