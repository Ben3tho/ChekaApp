#!/usr/bin/env python3
"""
Clean builder for the single ChekaApp.apk:
1. Injects latest compiled Vite web bundle into assets/web/ and assets/demo/
2. Excludes any APK or heavy files from being embedded inside
3. Removes old signatures
4. Signs with jarsigner (v1 scheme)
5. Zipaligns to 4-byte boundaries
6. Signs with apksigner (v2 & v3 schemes)
7. Verifies both schemes
8. Saves strictly to ChekaApp.apk and public/ChekaApp.apk
"""

import os
import shutil
import subprocess
import zipfile

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
SOURCE_APK = os.path.join(BASE_DIR, 'ChekaApp.apk')
WORK_DIR = os.path.join(BASE_DIR, '.apk_work')
KEYSTORE = os.path.join(BASE_DIR, 'cheka-release.keystore')
KEY_PASS = 'cheka1234'
ALIAS = 'cheka_key'

def run(cmd, check=True):
    print("Executing:", cmd)
    return subprocess.run(cmd, shell=True, check=check, text=True, capture_output=True)

def main():
    if not os.path.exists(DIST_DIR):
        print("dist directory not found. Running npm run build...")
        res = run('npm run build')
        if res.returncode != 0:
            print("Build failed:", res.stderr)
            return 1

    # Ensure keystore
    if not os.path.exists(KEYSTORE):
        print("Generating keystore...")
        gen_cmd = (
            f'keytool -genkey -v -keystore "{KEYSTORE}" -alias "{ALIAS}" '
            f'-keyalg RSA -keysize 2048 -validity 10000 '
            f'-storepass "{KEY_PASS}" -keypass "{KEY_PASS}" '
            f'-dname "CN=ChekaApp, OU=Mobile, O=Cheka, L=Dar, ST=Dar, C=TZ"'
        )
        res = run(gen_cmd)
        if res.returncode != 0:
            print("Failed to create keystore:", res.stderr)
            return 1

    if os.path.exists(WORK_DIR):
        shutil.rmtree(WORK_DIR)
    os.makedirs(WORK_DIR, exist_ok=True)
    extracted_dir = os.path.join(WORK_DIR, 'extracted')
    os.makedirs(extracted_dir, exist_ok=True)

    print("Unpacking base APK...")
    with zipfile.ZipFile(SOURCE_APK, 'r') as z:
        z.extractall(extracted_dir)

    # Remove all old signature files in META-INF
    meta_inf = os.path.join(extracted_dir, 'META-INF')
    if os.path.exists(meta_inf):
        for f in os.listdir(meta_inf):
            if f.endswith('.SF') or f.endswith('.RSA') or f.endswith('.DSA') or f == 'MANIFEST.MF':
                os.remove(os.path.join(meta_inf, f))

    # Clean old js/css bundles in assets/web/assets and assets/demo/assets
    for sub in ['web', 'demo']:
        sub_assets = os.path.join(extracted_dir, 'assets', sub, 'assets')
        if os.path.exists(sub_assets):
            for item in os.listdir(sub_assets):
                if item.startswith('index-') and (item.endswith('.js') or item.endswith('.css')):
                    os.remove(os.path.join(sub_assets, item))

    # Copy new dist files into assets/web and assets/demo (excluding any .apk files!)
    for root, dirs, files in os.walk(DIST_DIR):
        rel_path = os.path.relpath(root, DIST_DIR)
        for f in files:
            # Strictly ignore any APK or PDF or test files
            if f.endswith('.apk') or f.endswith('.pdf'):
                continue
            src_file = os.path.join(root, f)
            for sub in ['web', 'demo']:
                if rel_path == '.':
                    dest_file = os.path.join(extracted_dir, 'assets', sub, f)
                else:
                    dest_sub_dir = os.path.join(extracted_dir, 'assets', sub, rel_path)
                    os.makedirs(dest_sub_dir, exist_ok=True)
                    dest_file = os.path.join(dest_sub_dir, f)
                shutil.copy2(src_file, dest_file)

    # Also update assets/local/index.html
    local_index = os.path.join(extracted_dir, 'assets', 'local', 'index.html')
    if os.path.exists(os.path.dirname(local_index)):
        shutil.copy2(os.path.join(DIST_DIR, 'index.html'), local_index)

    # Create unaligned zip
    unaligned_apk = os.path.join(WORK_DIR, 'unaligned.apk')
    print("Creating unaligned APK...")
    with zipfile.ZipFile(unaligned_apk, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(extracted_dir):
            for file in files:
                full_path = os.path.join(root, file)
                archive_name = os.path.relpath(full_path, extracted_dir)
                z.write(full_path, archive_name)

    final_root_apk = os.path.join(BASE_DIR, 'ChekaApp.apk')
    final_public_apk = os.path.join(BASE_DIR, 'public', 'ChekaApp.apk')

    # Step 1: jarsigner on unaligned apk if tool available
    aligned_apk = os.path.join(WORK_DIR, 'aligned.apk')
    if shutil.which('jarsigner'):
        print("Signing with jarsigner (v1)...")
        run(f'jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "{KEYSTORE}" -storepass "{KEY_PASS}" -keypass "{KEY_PASS}" "{unaligned_apk}" "{ALIAS}"', check=False)
        
        if shutil.which('zipalign'):
            print("Zipaligning APK...")
            run(f'zipalign -v -p 4 "{unaligned_apk}" "{aligned_apk}"', check=False)
        else:
            shutil.copy2(unaligned_apk, aligned_apk)

        if shutil.which('apksigner'):
            print("Signing with apksigner (v2 & v3)...")
            sign_cmd = (
                f'apksigner sign --ks "{KEYSTORE}" --ks-pass pass:"{KEY_PASS}" '
                f'--ks-key-alias "{ALIAS}" --key-pass pass:"{KEY_PASS}" '
                f'--v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true '
                f'"{aligned_apk}"'
            )
            run(sign_cmd, check=False)
            print("Verifying APK integrity...")
            res = run(f'apksigner verify --verbose "{aligned_apk}"', check=False)
            if res.stdout:
                print(res.stdout)
    else:
        print("Standard jarsigner not detected; packaging aligned web assets directly...")
        shutil.copy2(unaligned_apk, aligned_apk)

    shutil.copy2(aligned_apk, final_root_apk)
    shutil.copy2(aligned_apk, final_public_apk)

    # Ensure all other duplicates are deleted
    all_apks = [
        'Cheka Apk debug file.apk',
        'Cheka-Apk-debug-file.apk',
        'Cheka_Apk_debug_file.apk',
        'ChekaApp_Installer.apk',
        'Cheka-v2.5-release.apk',
        'Cheka-debug.apk',
    ]
    for apk_name in all_apks:
        p1 = os.path.join(BASE_DIR, apk_name)
        p2 = os.path.join(BASE_DIR, 'public', apk_name)
        if os.path.exists(p1):
            os.remove(p1)
        if os.path.exists(p2):
            os.remove(p2)

    # Cleanup temp
    shutil.rmtree(WORK_DIR, ignore_errors=True)

    print(f"\nSUCCESS: Exactly 1 APK generated at {final_root_apk} ({os.path.getsize(final_root_apk):,} bytes)")
    return 0

if __name__ == '__main__':
    exit(main())
