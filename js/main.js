// ==========================================
// INISIALISASI FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC8PrjY_i0-jqEHbDZvAf5MwxNZnpa4VE4",
    authDomain: "hasna-fashion.firebaseapp.com",
    projectId: "hasna-fashion",
    storageBucket: "hasna-fashion.firebasestorage.app",
    messagingSenderId: "1004644128564",
    appId: "1:1004644128564:web:e7df2adc35c3d48908f761",
    measurementId: "G-3ELCTYLH11"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const productsCol = collection(db, "products");
const ordersCol = collection(db, "orders");

// Produk sekarang diambil dari Firestore, bukan hardcode lagi
let products = [];

const authBtn = document.getElementById('authBtn');
const adminLink = document.getElementById('adminLink');
const pesananLink = document.getElementById('pesananLink');

onAuthStateChanged(auth, (user) => {
    if (user) {
        authBtn.textContent = "Keluar";
        adminLink.style.display = "block";
        authBtn.onclick = (e) => {
            e.preventDefault();
            signOut(auth).then(() => { window.location.reload(); });
        };
    } else {
        authBtn.textContent = "Masuk";
        adminLink.style.display = "none";
        authBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = "login.html";
        };
    }
});
onAuthStateChanged(auth, (user) => {
    if (user) {
        authBtn.textContent = "Keluar";
        adminLink.style.display = "block";
        pesananLink.style.display = "block";
        authBtn.onclick = (e) => {
            e.preventDefault();
            signOut(auth).then(() => { window.location.reload(); });
        };
    } else {
        authBtn.textContent = "Masuk";
        adminLink.style.display = "none";
        pesananLink.style.display = "none";
        authBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = "login.html";
        };
    }
});
// ==========================================
// STATE & REFS
// ==========================================
const state = {
  filter: 'all',
  searchQuery: '',
  sort: 'default',
  maxPrice: 500000,
  cart: [],
};

const refs = {
  productGrid: document.getElementById('productGrid'),
  filterTabs: document.getElementById('filterTabs'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  priceRange: document.getElementById('priceRange'),
  priceLabel: document.getElementById('priceLabel'),
  cartBtn: document.getElementById('cartBtn'),
  cartOverlay: document.getElementById('cartOverlay'),
  cartSidebar: document.getElementById('cartSidebar'),
  cartClose: document.getElementById('cartClose'),
  cartItems: document.getElementById('cartItems'),
  cartEmpty: document.getElementById('cartEmpty'),
  cartFooter: document.getElementById('cartFooter'),
  subtotalAmt: document.getElementById('subtotalAmt'),
  ongkirAmt: document.getElementById('ongkirAmt'),
  totalAmt: document.getElementById('totalAmt'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  modalOverlay: document.getElementById('modalOverlay'),
  productModal: document.getElementById('productModal'),
  modalContent: document.getElementById('modalContent'),
  modalClose: document.getElementById('modalClose'),
  checkoutModal: document.getElementById('checkoutModal'),
  checkoutBody: document.getElementById('checkoutBody'),
  checkoutClose: document.getElementById('checkoutClose'),
  toast: document.getElementById('toast'),
  navLinks: document.getElementById('navLinks'),
  hamburger: document.getElementById('hamburger'),
  contactForm: document.getElementById('contactForm'),
  errName: document.getElementById('errName'),
  errEmail: document.getElementById('errEmail'),
  errMsg: document.getElementById('errMsg'),
  formSuccess: document.getElementById('formSuccess'),
};

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function generatePlaceholder(name) {
  const label = name || 'Gambar tidak tersedia';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='520' viewBox='0 0 400 520'>
    <rect width='400' height='520' fill='#f3efe9' rx='24' />
    <g transform='translate(40 100)'>
      <rect width='320' height='280' rx='20' fill='#e7ded5' />
      <path d='M40 90 L80 50 L120 90 L160 30 L200 90' fill='none' stroke='#c9897a' stroke-width='14' stroke-linecap='round' stroke-linejoin='round' opacity='0.7'/>
      <circle cx='80' cy='180' r='28' fill='#c9897a' opacity='0.65'/>
      <circle cx='182' cy='210' r='18' fill='#c9897a' opacity='0.45'/>
    </g>
    <text x='50%' y='440' text-anchor='middle' fill='#7d6b60' font-size='28' font-family='Inter, sans-serif'>${escapeXml(label)}</text>
  </svg>`;

  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch (e) {
    return 'images/placeholder.svg';
  }
}

// ==========================================
// AMBIL PRODUK DARI FIRESTORE (REAL-TIME)
// ==========================================
function listenToStoreProducts() {
  const q = query(productsCol, orderBy("name"));
  onSnapshot(q, (snapshot) => {
    products = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    updateFilterState();
  }, (error) => {
    console.error("Gagal memuat produk:", error);
    showToast('Gagal memuat produk: ' + error.message);
  });
}

function renderProducts(list) {
  if (!list.length) {
    refs.productGrid.innerHTML = '';
    document.getElementById('noResults').classList.remove('hidden');
    return;
  }

  document.getElementById('noResults').classList.add('hidden');
  refs.productGrid.innerHTML = list
    .map((product) => {
      return `
        <article class="product-card" data-product="${product.id}">
          <div class="card-badge ${product.tag === 'Sale' ? 'badge-sale' : 'badge-new'}">${product.tag || 'Populer'}</div>
          <div class="card-img">
            <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src=generatePlaceholder(this.alt)" />
            <div class="card-actions">
              <button class="card-action-btn btn-detail" data-id="${product.id}">Detail</button>
              <button class="card-action-btn btn-add-cart" data-id="${product.id}">Tambah</button>
            </div>
          </div>
          <div class="card-body">
            <p class="card-category">${product.category}</p>
            <h3 class="card-name">${product.name}</h3>
            <p class="card-rating">★ ${(product.rating || 0).toFixed(1)}</p>
            <div class="card-price">
              <span class="price-current">${formatRupiah(product.price)}</span>
              ${product.originalPrice > product.price ? `<span class="price-original">${formatRupiah(product.originalPrice)}</span>` : ''}
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function getFilteredProducts() {
  let filtered = [...products];

  if (state.filter !== 'all') {
    filtered = filtered.filter((item) => item.category === state.filter);
  }

  const searchText = state.searchQuery.trim().toLowerCase();
  if (searchText !== '') {
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchText) || item.category.toLowerCase().includes(searchText));
  }

  filtered = filtered.filter((item) => item.price <= state.maxPrice);

  if (state.sort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

function updateFilterState() {
  refs.priceLabel.textContent = formatRupiah(state.maxPrice);
  renderProducts(getFilteredProducts());
}

function handleFilterClick(event) {
  const button = event.target.closest('.filter-tab');
  if (!button) return;

  refs.filterTabs.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.remove('active'));
  button.classList.add('active');

  state.filter = button.dataset.filter;
  updateFilterState();
}

function showProductModal(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  refs.modalContent.innerHTML = `
    <div class="modal-inner">
      <div class="modal-img"><img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src=generatePlaceholder(this.alt)" /></div>
      <div class="modal-info">
        <p class="card-category">${product.category}</p>
        <h2>${product.name}</h2>
        <div class="card-price"><span class="price-current">${formatRupiah(product.price)}</span>${product.originalPrice > product.price ? `<span class="price-original">${formatRupiah(product.originalPrice)}</span>` : ''}</div>
        <p class="modal-desc">${product.description}</p>
        <div class="size-selector">
          <label>Pilihan Ukuran</label>
          <div class="size-options">
            ${(product.sizes || []).map((size, index) => `<button class="size-btn${index === 0 ? ' active' : ''}" type="button">${size}</button>`).join('')}
          </div>
        </div>
        <div class="qty-row">
          <label>Jumlah</label>
          <div class="qty-selector">
            <button class="qty-btn" type="button" data-action="decrease">-</button>
            <span class="qty-value" id="modalQty">1</span>
            <button class="qty-btn" type="button" data-action="increase">+</button>
          </div>
        </div>
        <button class="btn-primary full-width" id="modalAddCart" data-id="${product.id}">Tambah ke Keranjang</button>
      </div>
    </div>
  `;

  refs.modalOverlay.classList.add('open');
  refs.productModal.classList.add('open');
}

function closeProductModal() {
  refs.modalOverlay.classList.remove('open');
  refs.productModal.classList.remove('open');
}

function addToCart(productId, quantity = 1) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const existingItem = state.cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    state.cart.push({ ...product, quantity });
  }

  updateCartUI();
  showToast(`${product.name} berhasil ditambahkan ke keranjang.`);
}

function updateCartUI() {
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const ongkir = cartCount > 0 ? 15000 : 0;
  const total = subtotal + ongkir;

  const cartCountElement = document.getElementById('cartCount');
  if (cartCount > 0) {
    cartCountElement.textContent = cartCount;
    cartCountElement.classList.add('visible');
  } else {
    cartCountElement.textContent = 0;
    cartCountElement.classList.remove('visible');
  }

  refs.subtotalAmt.textContent = formatRupiah(subtotal);
  refs.ongkirAmt.textContent = formatRupiah(ongkir);
  refs.totalAmt.textContent = formatRupiah(total);

  if (!state.cart.length) {
    refs.cartItems.innerHTML = '';
    refs.cartEmpty.classList.remove('hidden');
    refs.cartFooter.style.display = 'none';
    return;
  }

  refs.cartEmpty.classList.add('hidden');
  refs.cartFooter.style.display = 'block';

  refs.cartItems.innerHTML = state.cart
    .map((item) => {
      return `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
          <div class="cart-item-info">
            <p class="cart-item-name">${item.name}</p>
            <p class="cart-item-price">${formatRupiah(item.price)} x ${item.quantity}</p>
            <div class="cart-item-qty">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
              <button class="remove-item" data-id="${item.id}">Hapus</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function handleCartAction(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const productId = button.dataset.id;
  const action = button.dataset.action;

  if (button.classList.contains('btn-add-cart')) {
    addToCart(productId);
    return;
  }

  if (button.classList.contains('remove-item')) {
    state.cart = state.cart.filter((item) => item.id !== productId);
    updateCartUI();
    return;
  }

  if (!productId) return;

  const cartItem = state.cart.find((item) => item.id === productId);
  if (!cartItem) return;

  if (action === 'increase') {
    cartItem.quantity += 1;
  } else if (action === 'decrease' && cartItem.quantity > 1) {
    cartItem.quantity -= 1;
  }

  state.cart = state.cart.filter((item) => item.quantity > 0);
  updateCartUI();
}

function openCart() {
  refs.cartSidebar.classList.add('open');
  refs.cartOverlay.classList.add('open');
}

function closeCart() {
  refs.cartSidebar.classList.remove('open');
  refs.cartOverlay.classList.remove('open');
}

// ==========================================
// CHECKOUT: SIMPAN KE FIRESTORE + WHATSAPP
// ==========================================
function openCheckout() {
  if (!state.cart.length) {
    showToast('Keranjang kosong. Tambahkan produk dulu.');
    return;
  }

  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const ongkir = 15000;
  const total = subtotal + ongkir;

  refs.checkoutBody.innerHTML = `
    <p class="checkout-section-title">Ringkasan Pesanan</p>
    ${state.cart.map((item) => `
      <div class="checkout-item">
        <span>${item.name} x ${item.quantity}</span>
        <span>${formatRupiah(item.price * item.quantity)}</span>
      </div>
    `).join('')}
    <div class="checkout-item"><strong>Subtotal</strong><strong>${formatRupiah(subtotal)}</strong></div>
    <div class="checkout-item"><span>Ongkir</span><span>${formatRupiah(ongkir)}</span></div>
    <div class="checkout-total"><span>Total Pembayaran</span><span>${formatRupiah(total)}</span></div>
    <p class="checkout-section-title">Metode Pembayaran</p>
<div class="payment-options">
  <label class="payment-opt selected"><input type="radio" name="payment" value="Transfer Bank" checked /> Transfer Bank</label>
  <label class="payment-opt"><input type="radio" name="payment" value="E-Wallet" /> E-Wallet</label>
  <label class="payment-opt"><input type="radio" name="payment" value="COD" /> COD</label>
</div>
<div id="qrPaymentArea" style="text-align:center;margin-bottom:20px;">
  <img src="images/qris.png.png" alt="QRIS Pembayaran" style="max-width:220px;border:1px solid #e7defa;border-radius:12px;padding:10px" />
  <p style="font-size:.85rem;color:#6b5b7d;margin-top:8px">Scan QR di atas untuk membayar via QRIS</p>
</div>
    </div>
    <div class="form-group" style="margin-top:16px">
      <label>Nama Penerima</label>
      <input type="text" id="orderName" placeholder="Nama lengkap" style="width:100%;padding:10px;border-radius:8px;border:1px solid #e7defa" />
    </div>
    <div class="form-group" style="margin-top:10px">
      <label>Nomor WhatsApp</label>
      <input type="text" id="orderPhone" placeholder="08xxxxxxxxxx" style="width:100%;padding:10px;border-radius:8px;border:1px solid #e7defa" />
    </div>
    <div class="form-group" style="margin-top:10px">
      <label>Alamat Pengiriman</label>
      <textarea id="orderAddress" rows="2" placeholder="Alamat lengkap" style="width:100%;padding:10px;border-radius:8px;border:1px solid #e7defa"></textarea>
    </div>
    <button class="btn-primary full-width" id="confirmOrderBtn" style="margin-top:16px">Konfirmasi Pesanan</button>
    <div id="checkoutSuccessArea"></div>
  `;

  refs.checkoutModal.classList.add('open');
refs.checkoutModal.classList.add('open');

// Tampilkan/sembunyikan QR sesuai metode pembayaran yang dipilih
const qrArea = document.getElementById('qrPaymentArea');
function toggleQr() {
  const selected = document.querySelector('input[name="payment"]:checked').value;
  qrArea.style.display = selected === 'COD' ? 'none' : 'block';
}
toggleQr(); // cek kondisi awal
document.querySelectorAll('input[name="payment"]').forEach((radio) => {
  radio.addEventListener('change', toggleQr);
});
  document.getElementById('confirmOrderBtn').addEventListener('click', async () => {
    const name = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const address = document.getElementById('orderAddress').value.trim();
    const paymentInput = document.querySelector('input[name="payment"]:checked');
    const payment = paymentInput ? paymentInput.value : 'Transfer Bank';

    if (!name || !phone || !address) {
      showToast('Nama, WhatsApp, dan alamat wajib diisi.');
      return;
    }

    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Menyimpan pesanan...';

    const orderData = {
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      paymentMethod: payment,
      items: state.cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      ongkir,
      total,
      status: 'menunggu konfirmasi',
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(ordersCol, orderData);

      const itemsText = state.cart.map((item) => `- ${item.name} x${item.quantity} (${formatRupiah(item.price * item.quantity)})`).join('%0A');
      const waMessage = `Halo, saya ${name} mau konfirmasi pesanan (No: ${docRef.id.slice(-6).toUpperCase()}):%0A%0A${itemsText}%0A%0ATotal: ${formatRupiah(total)}%0APembayaran: ${payment}%0AAlamat: ${address}`;
      const waNumber = "62895365699800"; // GANTI dengan nomor WhatsApp admin (format 62xxxx, tanpa +/spasi/strip)
      const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

      document.getElementById('checkoutSuccessArea').innerHTML = `
        <div class="checkout-success">
          <div class="barcode-icon">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <h3>Pesanan Berhasil Disimpan</h3>
          <p>Nomor pesanan: <strong>${docRef.id.slice(-6).toUpperCase()}</strong></p>
          <a href="${waLink}" target="_blank" class="btn-primary full-width" style="display:block;text-align:center;margin-top:12px;text-decoration:none">
            Konfirmasi via WhatsApp
          </a>
        </div>
      `;
      confirmBtn.style.display = 'none';

      state.cart = [];
      updateCartUI();
    } catch (err) {
      showToast('Gagal menyimpan pesanan: ' + err.message);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Konfirmasi Pesanan';
    }
  });
}

function closeCheckout() {
  refs.checkoutModal.classList.remove('open');
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add('show');
  window.clearTimeout(refs.toast.timeoutId);
  refs.toast.timeoutId = window.setTimeout(() => {
    refs.toast.classList.remove('show');
  }, 2200);
}

function validateContactForm(event) {
  event.preventDefault();

  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const message = document.getElementById('cMsg').value.trim();

  let isValid = true;
  refs.errName.textContent = '';
  refs.errEmail.textContent = '';
  refs.errMsg.textContent = '';

  if (!name) {
    refs.errName.textContent = 'Nama wajib diisi.';
    isValid = false;
  }

  if (!email || !email.includes('@')) {
    refs.errEmail.textContent = 'Email tidak valid.';
    isValid = false;
  }

  if (!message) {
    refs.errMsg.textContent = 'Pesan tidak boleh kosong.';
    isValid = false;
  }

  if (!isValid) return;

  refs.contactForm.reset();
  refs.formSuccess.classList.remove('hidden');
  window.setTimeout(() => refs.formSuccess.classList.add('hidden'), 3500);
}

function handleModalClicks(event) {
  const target = event.target;

  if (target.id === 'modalClose' || target === refs.modalOverlay) {
    closeProductModal();
    return;
  }

  if (target.closest('#modalAddCart')) {
    const modalId = target.closest('#modalAddCart').dataset.id;
    addToCart(modalId, Number(document.getElementById('modalQty').textContent));
    closeProductModal();
    return;
  }

  const qtyAction = target.dataset.action;
  if (qtyAction) {
    const qtyValue = document.getElementById('modalQty');
    let qty = Number(qtyValue.textContent);
    qty = qtyAction === 'increase' ? qty + 1 : Math.max(1, qty - 1);
    qtyValue.textContent = qty;
  }

  if (target.classList.contains('size-btn')) {
    document.querySelectorAll('.size-btn').forEach((button) => button.classList.remove('active'));
    target.classList.add('active');
  }
};

function handleCards(event) {
  const detailButton = event.target.closest('.btn-detail');
  const addButton = event.target.closest('.btn-add-cart');

  if (detailButton) {
    showProductModal(detailButton.dataset.id);
    return;
  }

  if (addButton) {
    addToCart(addButton.dataset.id);
  }
}

function handleHamburger() {
  refs.navLinks.classList.toggle('mobile-open');
}

function handleScrollNavbar() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

function init() {
  listenToStoreProducts(); // mulai dengarkan data produk dari Firestore secara real-time

  refs.filterTabs.addEventListener('click', handleFilterClick);
  refs.searchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    updateFilterState();
  });
  refs.sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    updateFilterState();
  });
  refs.priceRange.addEventListener('input', (event) => {
    state.maxPrice = Number(event.target.value);
    updateFilterState();
  });

  refs.productGrid.addEventListener('click', handleCards);
  refs.cartBtn.addEventListener('click', openCart);
  refs.cartClose.addEventListener('click', closeCart);
  refs.cartOverlay.addEventListener('click', () => {
    closeCart();
    closeProductModal();
  });
  refs.cartItems.addEventListener('click', handleCartAction);
  refs.checkoutBtn.addEventListener('click', openCheckout);
  refs.modalOverlay.addEventListener('click', handleModalClicks);
  refs.productModal.addEventListener('click', handleModalClicks);
  refs.modalClose.addEventListener('click', closeProductModal);
  refs.checkoutClose.addEventListener('click', closeCheckout);
  refs.hamburger.addEventListener('click', handleHamburger);
  window.addEventListener('scroll', handleScrollNavbar);
  refs.contactForm.addEventListener('submit', validateContactForm);
}
window.addEventListener('DOMContentLoaded', init);