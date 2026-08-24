// API endpoint: returns latest APK version info from GitHub releases
export async function GET() {
  try {
    const res = await fetch('https://api.github.com/repos/sametrsgl/Languago/releases/latest');
    const data = await res.json();
    const tag = data.tag_name || 'v2.5.0';
    const assets = data.assets || [];
    const apkAsset = assets.find((a: any) => a.name && a.name.endsWith('.apk')) || {};

    return new Response(JSON.stringify({
      version: tag,
      versionCode: parseInt((tag || '').replace(/[^0-9.]/g, '').split('.').pop() || '0'),
      apkUrl: (apkAsset as any)?.browser_download_url || 'https://github.com/sametrsgl/Languago/releases/latest',
      apkFilename: (apkAsset as any)?.name || 'Languago-latest.apk',
      publishedAt: data.published_at,
      body: data.body || ''
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({
      version: 'v2.5.2',
      versionCode: 20,
      apkUrl: 'https://github.com/sametrsgl/Languago/releases/latest',
      apkFilename: 'Languago-v2.5.2.apk'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}