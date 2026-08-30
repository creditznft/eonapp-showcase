const TOKEN = '21a049158b88ba5753ef69b45659efd9';

export async function onRequestGet() {
  return new Response(TOKEN, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
