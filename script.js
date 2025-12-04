const tg = window.Telegram.WebApp;
tg.expand(); // باز کردن اپ در تمام صفحه

// --- تنظیمات ربات (اینجا را پر کنید) ---
const BOT_TOKEN = "8518799534:AAHvT558CyTD6CikMP1xqkdRGWA1zUBwTYQ"; // توکن ربات را اینجا بگذارید
const CHAT_ID = "1092358288"; // آیدی عددی اکانتی که سفارش باید به آن برود

// --- داده‌های منو ---
const menuItems = [
    { id: 1, name: "پیتزا پپرونی", price: 180000 },
    { id: 2, name: "همبرگر مخصوص", price: 150000 },
    { id: 3, name: "سیب‌زمینی سرخ‌کرده", price: 60000 },
    { id: 4, name: "نوشابه کوکا", price: 25000 },
    { id: 5, name: "سالاد سزار", price: 120000 }
];

let cart = {}; // سبد خرید: { id: quantity }

// --- رندر کردن منو ---
const menuContainer = document.getElementById('menu-list');

menuItems.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'menu-item';
    itemDiv.innerHTML = `
        <div class="item-info">
            <h3>${item.name}</h3>
            <div class="price">${item.price.toLocaleString()} تومان</div>
        </div>
        <div class="controls">
            <button class="btn-remove" onclick="updateCart(${item.id}, -1)">-</button>
            <span class="count" id="count-${item.id}">0</span>
            <button class="btn-add" onclick="updateCart(${item.id}, 1)">+</button>
        </div>
    `;
    menuContainer.appendChild(itemDiv);
});

// --- مدیریت سبد خرید ---
function updateCart(id, change) {
    if (!cart[id]) cart[id] = 0;
    cart[id] += change;

    if (cart[id] < 0) cart[id] = 0;

    // بروزرسانی عدد در UI
    document.getElementById(`count-${id}`).innerText = cart[id];
    
    calculateTotal();
}

function calculateTotal() {
    let total = 0;
    let hasItems = false;

    menuItems.forEach(item => {
        if (cart[item.id] > 0) {
            total += item.price * cart[item.id];
            hasItems = true;
        }
    });

    document.getElementById('total-amount').innerText = total.toLocaleString();

    // نمایش یا مخفی کردن نوار پایین
    const bottomBar = document.getElementById('bottom-bar');
    if (hasItems) {
        bottomBar.classList.add('visible');
        tg.MainButton.show(); // دکمه اصلی تلگرام (اختیاری)
    } else {
        bottomBar.classList.remove('visible');
        tg.MainButton.hide();
    }
}

// --- ارسال سفارش به تلگرام ---
async function sendOrder() {
    // 1. آماده‌سازی متن سفارش
    let message = "🛍 *سفارش جدید ثبت شد:*\n\n";
    let total = 0;

    menuItems.forEach(item => {
        if (cart[item.id] > 0) {
            const sum = item.price * cart[item.id];
            message += `▪️ ${item.name} (x${cart[item.id]}) - ${sum.toLocaleString()} ت\n`;
            total += sum;
        }
    });

    message += `\n💰 *مجموع کل: ${total.toLocaleString()} تومان*`;
    
    // اضافه کردن اطلاعات کاربر (اگر در دسترس باشد)
    if(tg.initDataUnsafe && tg.initDataUnsafe.user) {
        message += `\n👤 مشتری: @${tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name}`;
    }

    // 2. ارسال درخواست به API تلگرام
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const btn = document.getElementById('order-btn');
    btn.innerText = "در حال ارسال...";
    btn.disabled = true;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "Markdown"
            })
        });

        if (response.ok) {
            tg.showAlert("سفارش شما با موفقیت ارسال شد! 🛵");
            tg.close(); // بستن مینی اپ
        } else {
            tg.showAlert("خطا در ارسال سفارش.");
            btn.innerText = "ثبت سفارش ✅";
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        tg.showAlert("مشکل در ارتباط با سرور.");
        btn.innerText = "ثبت سفارش ✅";
        btn.disabled = false;
    }
}