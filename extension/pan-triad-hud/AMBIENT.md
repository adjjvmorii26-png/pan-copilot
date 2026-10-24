# Optional ambient (Pexels / any HTTPS image)

No API key embedded. Set a direct image URL:

```js
chrome.storage.local.set({
  panAmbientUrl: 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=600'
})
```

Clear with `chrome.storage.local.remove('panAmbientUrl')`.
Prefer dark abstract/space images; opacity ~18%.
