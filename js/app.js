/* AHUMADOS DON JOCÉ — carrito + catálogo + checkout WhatsApp
   Aplicación estática apta para GitHub Pages. Sin backend ni datos enviados
   hasta que el comprador pulse explícitamente "Enviar pedido".
*/
(() => {
  'use strict';
  const config = window.AHUMADOS_CONFIG || {};
  const products = Array.isArray(window.AHUMADOS_PRODUCTOS) ? window.AHUMADOS_PRODUCTOS : [];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icon = name => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const sanitize = input => String(input ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = price => `S/ ${Number(price).toFixed(2)}`;
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const findProduct = id => products.find(item => item.id === id);
  const cartKey = 'ahumados_don_joce_carrito_v1';

  let cart = readCart();
  let filter = 'Todos';
  let search = '';
  let activeDialog = null;
  let activeProduct = null;
  let detailQty = 1;
  let slideIndex = 0;
  let toastTimer;
  let focusBeforeDialog;
  const cardQuantities = Object.fromEntries(products.map(item => [item.id, 1]));
  const slides = [products[0], products[3], products[7]].filter(Boolean);

  function readCart() {
    try {
      const data = JSON.parse(localStorage.getItem(cartKey) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(line => line && typeof line.id === 'string' && findProduct(line.id))
        .map(line => ({id: line.id, qty: Math.max(1, Math.min(99, Number(line.qty) || 1)), nota: String(line.nota || '').slice(0,150)}));
    } catch (_) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch (_) { /* Navegador con almacenamiento deshabilitado: carrito en memoria */ }
  }
  function itemCount() { return cart.reduce((sum, item) => sum + item.qty, 0); }
  function subtotal() { return cart.reduce((sum, item) => sum + (findProduct(item.id)?.precio ?? 0) * item.qty, 0); }
  function hasPending() { return cart.some(item => findProduct(item.id)?.precio == null); }
  function escapeAttr(text) { return sanitize(text); }
  function toast(text) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('show'), 3200);
  }
  function scrollToCatalog() {
    $('#productos').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
  }

  // PRODUCTOS: tarjetas, cantidades, filtros y buscador.
  function renderProducts() {
    const visible = products.filter(item => (filter === 'Todos' || item.categoria === filter) && normalize(`${item.nombre} ${item.categoria} ${item.descripcion}`).includes(normalize(search)));
    const container = $('#productGrid');
    container.innerHTML = visible.length ? visible.map((item, i) => `
      <article class="product-card" style="animation-delay:${Math.min(i * 40,260)}ms" data-id="${escapeAttr(item.id)}">
        <div class="product-image-wrap" data-detail="${escapeAttr(item.id)}" role="button" tabindex="0" aria-label="Ver detalles de ${escapeAttr(item.nombre)}">
          <img src="${escapeAttr(item.imagen)}" alt="${escapeAttr(item.nombre)}, fotografía referencial sin etiqueta" width="510" height="340" loading="lazy">
          <span class="product-tag ${item.precio == null ? 'pending' : ''}">${escapeAttr(item.etiqueta)}</span>
          <button class="view-product" type="button" data-detail="${escapeAttr(item.id)}" aria-label="Ver detalles de ${escapeAttr(item.nombre)}">Ver detalle +</button>
        </div>
        <div class="product-body"><span class="product-category">${escapeAttr(item.categoria)}</span><h3>${escapeAttr(item.nombre)}</h3><p class="product-desc">${escapeAttr(item.descripcion)}</p><div class="product-price ${item.precio == null ? 'pending' : ''}">${item.precio == null ? 'Precio por consultar' : money(item.precio)}</div>
          <div class="product-foot"><div class="qty-control"><button type="button" data-less="${escapeAttr(item.id)}" aria-label="Restar cantidad de ${escapeAttr(item.nombre)}">${icon('minus')}</button><output aria-label="Cantidad" data-quantity="${escapeAttr(item.id)}">${cardQuantities[item.id] || 1}</output><button type="button" data-more="${escapeAttr(item.id)}" aria-label="Aumentar cantidad de ${escapeAttr(item.nombre)}">${icon('plus')}</button></div><button class="add-card" type="button" data-add="${escapeAttr(item.id)}">${icon('cart')} Agregar</button></div>
        </div>
      </article>`).join('') : '<div class="empty-search"><strong>Sin resultados por aquí.</strong>Prueba con otra palabra o selecciona otra categoría.</div>';
  }
  function changeCardQty(id, change) {
    cardQuantities[id] = Math.max(1, Math.min(99, (cardQuantities[id] || 1) + change));
    const output = $$('[data-quantity]').find(node => node.dataset.quantity === id);
    if (output) output.textContent = cardQuantities[id];
  }
  function addToCart(id, qty = 1, note = '') {
    if (!findProduct(id)) return;
    const cleanNote = String(note || '').trim().slice(0,150);
    const existing = cart.find(line => line.id === id && line.nota === cleanNote);
    if (existing) existing.qty = Math.min(99, existing.qty + qty);
    else cart.push({id, qty: Math.max(1, Math.min(99,qty)), nota: cleanNote});
    saveCart(); renderCart();
    $('#addedName').textContent = findProduct(id).nombre;
    $('#floatingCart').classList.remove('pulse');
    void $('#floatingCart').offsetWidth;
    $('#floatingCart').classList.add('pulse');
    openDialog('added');
  }
  $('#productGrid').addEventListener('click', event => {
    const less = event.target.closest('[data-less]');
    const more = event.target.closest('[data-more]');
    const add = event.target.closest('[data-add]');
    const detail = event.target.closest('[data-detail]');
    if (less) changeCardQty(less.dataset.less, -1);
    else if (more) changeCardQty(more.dataset.more, 1);
    else if (add) addToCart(add.dataset.add, cardQuantities[add.dataset.add] || 1);
    else if (detail) showProduct(detail.dataset.detail);
  });
  $('#productGrid').addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.classList.contains('product-image-wrap')) {
      event.preventDefault(); showProduct(event.target.dataset.detail);
    }
  });
  $$('#filters [data-filter]').forEach(btn => btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    $$('#filters [data-filter]').forEach(button => {
      button.classList.toggle('active', button === btn);
      button.setAttribute('aria-pressed', String(button === btn));
    });
    renderProducts();
  }));
  $('#catalogSearch').addEventListener('input', event => { search = event.target.value.trim(); renderProducts(); });

  // DETALLES DE PRODUCTO
  function showProduct(id) {
    const product = findProduct(id);
    if (!product) return;
    activeProduct = product;
    detailQty = 1;
    $('#detailImage').src = product.imagen;
    $('#detailImage').alt = `Imagen referencial de ${product.nombre}`;
    $('#detailCategory').textContent = product.categoria.toUpperCase();
    $('#detailName').textContent = product.nombre;
    $('#detailDescription').textContent = product.descripcion;
    $('#detailPrice').textContent = product.precio == null ? 'Precio por consultar' : money(product.precio);
    $('#detailPrice').classList.toggle('pending', product.precio == null);
    $('#detailNote').value = '';
    $('#detailQuantity').textContent = detailQty;
    openDialog('product');
  }
  $('#detailMinus').addEventListener('click', () => { detailQty = Math.max(1, detailQty-1); $('#detailQuantity').textContent = detailQty; });
  $('#detailPlus').addEventListener('click', () => { detailQty = Math.min(99, detailQty+1); $('#detailQuantity').textContent = detailQty; });
  $('#detailAdd').addEventListener('click', () => { if (activeProduct) addToCart(activeProduct.id, detailQty, $('#detailNote').value); });

  // CARRITO Y RESUMEN
  function updateCounts() {
    const count = itemCount();
    $('#navCount').textContent = count;
    $('#floatingCount').textContent = count;
    $('#drawerCount').textContent = `(${count})`;
  }
  function updateCartLine(index, delta) {
    const line = cart[index];
    if (!line) return;
    if (delta === 'remove' || line.qty + delta <= 0) cart.splice(index, 1);
    else line.qty = Math.min(99, line.qty + delta);
    saveCart(); renderCart();
  }
  function renderCart() {
    updateCounts();
    const items = $('#cartItems');
    if (!cart.length) {
      items.innerHTML = `<div class="cart-empty"><span class="empty-icon">${icon('cart')}</span><h3>Tu carrito está esperando</h3><p>Agrega tus sabores favoritos para comenzar un pedido delicioso.</p><button class="btn btn-orange" type="button" id="emptyShop">Ver productos ${icon('arrow')}</button></div>`;
      $('#emptyShop').addEventListener('click', () => { closeDialog(); scrollToCatalog(); });
      $('#drawerSummary').hidden = true;
      $('#checkoutSection').hidden = true;
      return;
    }
    items.innerHTML = cart.map((line,index) => {
      const product = findProduct(line.id);
      return `<article class="cart-item"><img src="${escapeAttr(product.imagen)}" alt="${escapeAttr(product.nombre)}"><div class="cart-item-info"><strong>${escapeAttr(product.nombre)}</strong><span class="line-price ${product.precio == null ? 'pending':''}">${product.precio == null ? 'Precio por confirmar' : money(product.precio * line.qty)}</span>${line.nota ? `<small>Nota: ${sanitize(line.nota)}</small>` : ''}<div class="cart-quantity"><button type="button" data-cart-less="${index}" aria-label="Restar uno">${icon('minus')}</button><output>${line.qty}</output><button type="button" data-cart-more="${index}" aria-label="Sumar uno">${icon('plus')}</button></div></div><button class="remove-item" type="button" data-cart-remove="${index}" aria-label="Eliminar ${escapeAttr(product.nombre)}">${icon('trash')}</button></article>`;
    }).join('');
    $('#drawerSummary').hidden = false;
    $('#checkoutSection').hidden = false;
    $('#drawerSummary').innerHTML = `<div class="summary-line"><span>Productos en tu pedido</span><strong>${itemCount()}</strong></div><div class="summary-line"><span>Subtotal con precios disponibles</span><strong>${money(subtotal())}</strong></div>${hasPending() ? '<div class="summary-line"><span>Productos sin precio indicado</span><strong>Por confirmar</strong></div>' : ''}<div class="summary-line"><span>Delivery</span><strong>${getDeliveryMode() === 'Recojo' ? 'No aplica' : config.costoDelivery == null ? 'Por confirmar' : money(config.costoDelivery)}</strong></div><div class="summary-line summary-total"><span>${hasPending() || (getDeliveryMode() === 'Delivery' && config.costoDelivery == null) ? 'Total referencial' : 'Total'}</span><strong>${money(subtotal()+(getDeliveryMode() === 'Delivery' ? (Number(config.costoDelivery)||0) : 0))}</strong></div><div class="summary-note">${hasPending() || (getDeliveryMode() === 'Delivery' && config.costoDelivery == null) ? 'El total final será confirmado por el negocio según precios pendientes, disponibilidad y costo de envío.' : 'Importe calculado según los precios registrados.'}</div>`;
    $('#setupWarning').hidden = isWhatsAppConfigured();
  }
  $('#cartItems').addEventListener('click', event => {
    const less = event.target.closest('[data-cart-less]');
    const more = event.target.closest('[data-cart-more]');
    const remove = event.target.closest('[data-cart-remove]');
    if (less) updateCartLine(Number(less.dataset.cartLess), -1);
    else if (more) updateCartLine(Number(more.dataset.cartMore), 1);
    else if (remove) updateCartLine(Number(remove.dataset.cartRemove), 'remove');
  });

  // FORMULARIO DINÁMICO
  function getDeliveryMode() { return $('input[name="modality"]:checked')?.value || 'Delivery'; }
  function getPaymentMode() { return $('input[name="payment"]:checked')?.value || 'Yape'; }
  function updateChoiceStyles(groupId) {
    $$('#'+groupId+' .choice-card').forEach(label => label.classList.toggle('selected', Boolean($('input',label)?.checked)));
  }
  function updateShippingFields() {
    const delivery = getDeliveryMode() === 'Delivery';
    $('#deliveryFields').hidden = !delivery;
    $('#clientDistrict').required = delivery;
    $('#clientAddress').required = delivery;
    updateChoiceStyles('shippingChoices');
    renderCart();
  }
  $$('input[name="modality"]').forEach(input => input.addEventListener('change', updateShippingFields));
  $$('input[name="payment"]').forEach(input => input.addEventListener('change', () => updateChoiceStyles('paymentChoices')));
  function digitsOnly(value) { return String(value).replace(/\D/g,''); }
  function validateOrder() {
    if (!cart.length) { toast('Primero agrega productos a tu carrito.'); return false; }
    const name = $('#clientName'); const phone = $('#clientPhone');
    const required = [name,phone];
    if (getDeliveryMode() === 'Delivery') required.push($('#clientDistrict'), $('#clientAddress'));
    $$('input.invalid,textarea.invalid').forEach(el => el.classList.remove('invalid'));
    const missing = required.find(el => !el.value.trim());
    if (missing) { missing.classList.add('invalid');missing.focus();toast('Completa los datos obligatorios de tu pedido.');return false; }
    if (name.value.trim().length < 3) { name.classList.add('invalid'); name.focus();toast('Escribe tu nombre completo.');return false; }
    const phoneDigits = digitsOnly(phone.value);
    if (!/^(?:51)?9\d{8}$/.test(phoneDigits)) { phone.classList.add('invalid');phone.focus();toast('Ingresa un celular peruano válido de 9 dígitos.');return false; }
    return true;
  }
  function isWhatsAppConfigured() { return /^519\d{8}$/.test(digitsOnly(config.telefonoWhatsApp || '')); }
  function orderMessage() {
    const clientName = $('#clientName').value.trim();
    const clientPhone = $('#clientPhone').value.trim();
    const modality = getDeliveryMode();
    const payment = getPaymentMode();
    const lines = [
      `🌿 *NUEVO PEDIDO — ${config.nombre || 'AHUMADOS DON JOCÉ'}*`,
      '',
      `👤 *Cliente:* ${clientName}`,
      `📱 *Celular:* ${clientPhone}`,
      '',
      '🧺 *DETALLE DEL PEDIDO*'
    ];
    cart.forEach((line,index) => {
      const product = findProduct(line.id);
      lines.push(`${index+1}. ${line.qty} × ${product.nombre} — ${product.precio == null ? 'Precio por confirmar' : money(product.precio * line.qty)}`);
      if (product.precio != null) lines.push(`   Precio por unidad: ${money(product.precio)}`);
      if (line.nota) lines.push(`   • Indicación: ${line.nota}`);
    });
    lines.push('',`💰 *Subtotal conocido:* ${money(subtotal())}`);
    if (hasPending()) lines.push('⚠️ Hay productos con precios por confirmar.');
    lines.push(`🚚 *Modalidad:* ${modality}`);
    if (modality === 'Delivery') {
      lines.push(`📍 *Distrito:* ${$('#clientDistrict').value.trim()}`);
      lines.push(`🏠 *Dirección:* ${$('#clientAddress').value.trim()}`);
      const ref = $('#clientReference').value.trim();
      if (ref) lines.push(`📌 *Referencia:* ${ref}`);
      lines.push(`🛵 *Costo de envío:* ${config.costoDelivery == null ? 'Por confirmar' : money(config.costoDelivery)}`);
    }
    lines.push(`💳 *Método de pago:* ${payment}`);
    const notes = $('#clientNotes').value.trim();
    if (notes) lines.push(`📝 *Notas adicionales:* ${notes}`);
    lines.push('', 'Por favor, confírmenme la disponibilidad, la presentación, el total final y los datos de pago. ¡Gracias!');
    return lines.join('\n');
  }
  $('#checkoutForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!validateOrder()) return;
    if (!isWhatsAppConfigured()) {
      $('#setupWarning').hidden = false;
      toast('Configura primero el número de WhatsApp del negocio en datos/config.js.');
      $('#setupWarning').scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    const link = `https://wa.me/${digitsOnly(config.telefonoWhatsApp)}?text=${encodeURIComponent(orderMessage())}`;
    // Solo se abre WhatsApp tras la acción explícita del comprador; sin cobro automático.
    window.open(link,'_blank','noopener,noreferrer');
    toast('Se abrió WhatsApp con el resumen. Confirma allí el envío del mensaje.');
  });
  $('#copyOrder').addEventListener('click', async () => {
    if (!validateOrder()) return;
    const text = orderMessage();
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea');
        ta.value = text;ta.style.position='fixed';ta.style.opacity='0';
        document.body.append(ta);ta.select();
        if (!document.execCommand('copy')) throw Error('No se pudo copiar');
        ta.remove();
      }
      toast('¡Pedido copiado! Pégalo donde necesites.');
    } catch (_) { toast('No se pudo copiar automáticamente. Prueba desde un sitio HTTPS.'); }
  });

  // APERTURA Y CIERRE DE MODALES
  const dialogEls = {cart:$('#cartDrawer'),added:$('#addedModal'),product:$('#productModal')};
  function openDialog(which) {
    if (!dialogEls[which]) return;
    if (!activeDialog) focusBeforeDialog = document.activeElement;
    Object.entries(dialogEls).forEach(([key,el]) => {
      const selected = key === which;
      el.classList.toggle('open',selected);
      el.setAttribute('aria-hidden',String(!selected));
    });
    activeDialog = which;
    const overlay = $('#overlay');
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('visible'));
    document.body.classList.add('overlay-open');
    if (which === 'cart') renderCart();
    window.setTimeout(() => {
      if (activeDialog === which) dialogEls[which].querySelector('[data-close],input,button')?.focus({preventScroll:true});
    },110);
  }
  function closeDialog() {
    Object.values(dialogEls).forEach(el => {el.classList.remove('open');el.setAttribute('aria-hidden','true');});
    $('#overlay').classList.remove('visible');
    $('#overlay').hidden = true;
    document.body.classList.remove('overlay-open');
    activeDialog = null;
    focusBeforeDialog?.focus?.({preventScroll:true});
  }
  $$('[data-open-cart]').forEach(button => button.addEventListener('click', () => openDialog('cart')));
  $$('[data-close]').forEach(button => button.addEventListener('click',closeDialog));
  $('#overlay').addEventListener('click',closeDialog);
  $('#confirmOrderBtn').addEventListener('click', () => openDialog('cart'));
  $('#continueShoppingBtn').addEventListener('click', closeDialog);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeDialog) closeDialog();
    if (event.key !== 'Tab' || !activeDialog) return;
    // Mantiene el foco dentro del diálogo activo.
    const focusables = $$('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),textarea:not([disabled]),[tabindex="0"]', dialogEls[activeDialog])
      .filter(el => el.getClientRects().length > 0);
    if (!focusables.length) return;
    const first = focusables[0],last=focusables[focusables.length-1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  });

  // SLIDER + ANIMACIONES
  function renderSlide() {
    const product = slides[slideIndex];
    if (!product) return;
    const img = $('#heroImage');
    img.style.opacity = '0.25';
    window.setTimeout(() => {img.src=product.imagen;img.alt=`${product.nombre}, fotografía referencial`;$('#heroProductName').textContent=product.nombre;img.style.opacity='1';},140);
    $('#sliderDots').innerHTML = slides.map((_,index) => `<button type="button" class="slider-dot ${index === slideIndex ? 'active':''}" data-slide="${index}" aria-label="Ver destacado ${index+1}" aria-pressed="${index === slideIndex}"></button>`).join('');
  }
  function goSlide(delta) { slideIndex=(slideIndex+delta+slides.length)%slides.length;renderSlide(); }
  $('#slidePrev').addEventListener('click', () => goSlide(-1));
  $('#slideNext').addEventListener('click', () => goSlide(1));
  $('#sliderDots').addEventListener('click', event => {const button=event.target.closest('[data-slide]');if(button){slideIndex=Number(button.dataset.slide);renderSlide();}});
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(() => {if(!document.hidden && !activeDialog)goSlide(1);},6500);
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('visible');obs.unobserve(entry.target);}});
    }, {threshold:.12,rootMargin:'0px 0px 20px 0px'});
    $$('.reveal').forEach(el => observer.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('visible'));

  // CONFIGURACIÓN DE LINKS + INICIALIZACIÓN
  $('#instagramLink').href = config.redes?.instagram || 'https://www.instagram.com/';
  $('#facebookLink').href = config.redes?.facebook || 'https://www.facebook.com/';
  $('#tiktokLink').href = config.redes?.tiktok || 'https://www.tiktok.com/';
  $('#year').textContent = new Date().getFullYear();
  renderProducts();
  renderCart();
  updateChoiceStyles('paymentChoices');
  updateChoiceStyles('shippingChoices');
  $('#deliveryFields').hidden = getDeliveryMode() !== 'Delivery';
  renderSlide();
})();
