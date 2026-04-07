#!/usr/bin/env python
"""
NeuroVoice Startup Script
Starts both backend and frontend servers
Windows-compatible batch launcher
"""

import subprocess
import os
import sys
import time
import platform

def print_banner():
    print("\n" + "="*70)
    print("🧠 NEUROVOICE - PARKINSON'S DISEASE SCREENING")
    print("="*70)
    print("\n📊 Starting integrated system...\n")

def start_backend():
    """Start Flask backend server"""
    print("[1/2] Starting Backend Server...")
    print("      Location: neurovoice-backend/")
    print("      Port: 5000")
    print("      URL: http://localhost:5000")
    
    backend_dir = os.path.join(os.path.dirname(__file__), 'neurovoice-backend')
    python_exe = sys.executable
    
    if platform.system() == 'Windows':
        # Windows command
        subprocess.Popen([python_exe, 'app_ml.py'], cwd=backend_dir)
    else:
        subprocess.Popen(['python3', 'app_ml.py'], cwd=backend_dir)
    
    print("      ✓ Backend starting...")
    time.sleep(3)

def start_frontend():
    """Start React frontend server"""
    print("[2/2] Starting Frontend Server...")
    print("      Location: neurovoice-frontend/")
    print("      Port: 3000")
    print("      URL: http://localhost:3000")
    
    frontend_dir = os.path.join(os.path.dirname(__file__), 'neurovoice-frontend')
    
    if platform.system() == 'Windows':
        # Windows command
        subprocess.Popen('npm start', shell=True, cwd=frontend_dir)
    else:
        subprocess.Popen(['npm', 'start'], cwd=frontend_dir)
    
    print("      ✓ Frontend starting...")
    time.sleep(2)

def main():
    print_banner()
    
    try:
        # Start servers
        start_backend()
        start_frontend()
        
        # Print success message
        print("\n" + "="*70)
        print("✅ SYSTEM STARTED SUCCESSFULLY")
        print("="*70)
        
        print("\n🌐 Access the application:")
        print("   Frontend: http://localhost:3000")
        print("   Backend:  http://localhost:5000")
        
        print("\n📋 Available Features:")
        print("   • Record and upload voice samples")
        print("   • Real-time Parkinson's risk analysis")
        print("   • Detailed vocal feature analysis")
        print("   • Risk level classification")
        print("   • Patient history tracking")
        
        print("\n🔌 API Endpoints:")
        print("   GET  /health          - System status")
        print("   POST /predict         - Analyze single audio")
        print("   POST /predict/batch   - Batch analysis")
        
        print("\n⏸️  Press Ctrl+C to stop both servers")
        print("="*70 + "\n")
        
        # Keep script running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Shutting down servers...")
        print("   ✓ Servers stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
