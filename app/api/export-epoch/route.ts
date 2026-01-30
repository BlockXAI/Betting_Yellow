import { NextRequest, NextResponse } from 'next/server';
import { sessionExporter, SessionData } from '@/lib/sessionExporter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { sessionId, participants, allocations, timestamp, rounds } = body;

    if (!sessionId || !participants || !allocations) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, participants, allocations' },
        { status: 400 }
      );
    }

    const sessionData: SessionData = {
      sessionId,
      participants,
      allocations,
      timestamp: timestamp || Date.now(),
      rounds: rounds || 0,
    };

    const result = await sessionExporter.exportSession(sessionData);

    return NextResponse.json({
      success: true,
      message: 'Session exported successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export session', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const epochId = searchParams.get('epochId');

    if (epochId) {
      const metadata = await sessionExporter.getEpochMetadata(epochId);
      const csv = await sessionExporter.readLiabilitiesCSV(epochId);
      
      return NextResponse.json({
        success: true,
        data: {
          metadata,
          csv,
        },
      });
    } else {
      const epochs = await sessionExporter.listEpochs();
      
      return NextResponse.json({
        success: true,
        data: {
          epochs,
          count: epochs.length,
        },
      });
    }
  } catch (error: any) {
    console.error('Get epochs error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve epochs', details: error.message },
      { status: 500 }
    );
  }
}
