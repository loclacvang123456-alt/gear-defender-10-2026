import os
import zipfile

def make_zip(source_dir, output_zip):
    if os.path.exists(output_zip):
        os.remove(output_zip)
        
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Ensure forward slashes for Linux server compatibility
                arcname = os.path.relpath(file_path, source_dir).replace('\\', '/')
                
                # Create ZipInfo to ensure proper Unix permissions and forward slashes
                zinfo = zipfile.ZipInfo.from_file(file_path, arcname)
                # Standard file permission 0o644 (-rw-r--r--)
                zinfo.external_attr = 0o644 << 16
                
                with open(file_path, 'rb') as f:
                    zipf.writestr(zinfo, f.read())
                    
    print(f"Created {output_zip} successfully ({os.path.getsize(output_zip)} bytes).")

if __name__ == '__main__':
    make_zip('dist', 'gear-defender-game.zip')
