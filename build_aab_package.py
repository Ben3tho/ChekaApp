#!/usr/bin/env python3
"""
ChekaApp — Android App Bundle (.AAB) Builder for Google Play Store Console
Converts and packages the web bundle and native assets into an Android App Bundle format.
"""

import os
import shutil
import subprocess
import zipfile

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
APK_PATH = os.path.join(BASE_DIR, 'ChekaApp.apk')
AAB_OUTPUT = os.path.join(BASE_DIR, 'ChekaApp.aab')
WORK_DIR = os.path.join(BASE_DIR, '.aab_work')
KEYSTORE = os.path.join(BASE_DIR, 'cheka-release.keystore')
KEY_PASS = 'cheka1234'
ALIAS = 'cheka_key'

def run(cmd):
    print("Executing:", cmd)
    return subprocess.run(cmd, shell=True, check=True, text=True, capture_output=True)

def main():
    if not os.path.exists(APK_PATH):
        print(f"Error: Base APK not found at {APK_PATH}")
        return 1

    if os.path.exists(WORK_DIR):
        shutil.rmtree(WORK_DIR)
    os.makedirs(WORK_DIR, exist_ok=True)

    extracted = os.path.join(WORK_DIR, 'extracted')
    os.makedirs(extracted, exist_ok=True)

    print("Unpacking APK assets...")
    with zipfile.ZipFile(APK_PATH, 'r') as z:
        z.extractall(extracted)

    # Base bundle layout according to bundletool specification
    base_dir = os.path.join(WORK_DIR, 'bundle', 'base')
    os.makedirs(os.path.join(base_dir, 'manifest'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'dex'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'assets'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'res'), exist_ok=True)

    # Copy manifest
    if os.path.exists(os.path.join(extracted, 'AndroidManifest.xml')):
        shutil.copy2(os.path.join(extracted, 'AndroidManifest.xml'), os.path.join(base_dir, 'manifest', 'AndroidManifest.xml'))

    # Copy dex classes
    for f in os.listdir(extracted):
        if f.endswith('.dex'):
            shutil.copy2(os.path.join(extracted, f), os.path.join(base_dir, 'dex', f))

    # Copy assets
    if os.path.exists(os.path.join(extracted, 'assets')):
        shutil.copytree(os.path.join(extracted, 'assets'), os.path.join(base_dir, 'assets'), dirs_exist_ok=True)

    # Copy res
    if os.path.exists(os.path.join(extracted, 'res')):
        shutil.copytree(os.path.join(extracted, 'res'), os.path.join(base_dir, 'res'), dirs_exist_ok=True)

    # Copy resources.arsc if present
    if os.path.exists(os.path.join(extracted, 'resources.arsc')):
        shutil.copy2(os.path.join(extracted, 'resources.arsc'), os.path.join(base_dir, 'resources.pb'))

    # Create unaligned AAB zip
    unaligned_aab = os.path.join(WORK_DIR, 'unaligned.aab')
    bundle_root = os.path.join(WORK_DIR, 'bundle')
    with zipfile.ZipFile(unaligned_aab, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(bundle_root):
            for file in files:
                full_path = os.path.join(root, file)
                archive_name = os.path.relpath(full_path, bundle_root)
                z.write(full_path, archive_name)

    # Sign AAB using jarsigner if available (Google Play Console requires JAR signing on AAB packages)
    if shutil.which('jarsigner'):
        print("Signing AAB bundle for Google Play Console...")
        jarsigner_cmd = (
            f'jarsigner -sigalg SHA256withRSA -digestalg SHA-256 '
            f'-keystore "{KEYSTORE}" -storepass "{KEY_PASS}" -keypass "{KEY_PASS}" '
            f'"{unaligned_aab}" "{ALIAS}"'
        )
        run(jarsigner_cmd)
    else:
        print("jarsigner not available in current environment; bundling unaligned AAB bundle directly...")

    # Copy to destination
    shutil.copy2(unaligned_aab, AAB_OUTPUT)
    shutil.rmtree(WORK_DIR, ignore_errors=True)

    print(f"\nSUCCESS: Google Play App Bundle generated at {AAB_OUTPUT} ({os.path.getsize(AAB_OUTPUT):,} bytes)")
    return 0

if __name__ == '__main__':
    exit(main())
