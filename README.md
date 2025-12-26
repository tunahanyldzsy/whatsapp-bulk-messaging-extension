# 📱 WhatsApp Toplu Mesaj Gönderici

Bu eklenti, WhatsApp Web üzerinden Excel listenizdeki kişilere otomatik ve kişiselleştirilmiş toplu mesaj göndermenizi sağlar. Modern arayüzü ve gizlilik özellikleri ile WhatsApp deneyiminizi geliştirir.

![Logo](icon.png)   

## 🚀 Özellikler

-   **Excel İle Toplu Gönderim**: `.xlsx` formatındaki kişi listelerini yükleyin.
-   **Kişiselleştirilmiş Mesajlar**: `{Ad}`, `{Soyad}` ve `{Hitap}` değişkenlerini kullanarak her kişiye özel mesaj oluşturun.
-   **Etiket Filtreleme**: Excel dosyasındaki etiketlere göre gönderim yapın.
-   **Gizlilik Modu**: Sohbet listenizi (isimler, mesajlar, fotoğraflar) tek tıkla bulanıklaştırın. Ekran görüntüsü almak veya kalabalık ortamlarda çalışmak için idealdir.
-   **Hızlı Erişim**: WhatsApp başlığındaki (yeni sohbet butonunun yanındaki) **Göz İkonuna** tıklayarak gizlilik modunu anında açıp kapatabilirsiniz.
-   **Doğal UI**: WhatsApp Web'in (Light/Dark) temasıyla birebir uyumlu modern tasarım.
-   **Akıllı Bekleme**: Spam algılanmaması için mesajlar arası rastgele bekleme süreleri.

## 📦 Kurulum

1.  GitHub üzerinden indirdiğiniz **`WhatsappSender_v1.0.zip`** (veya `.rar`) dosyasını bilgisayarınıza indirin.
2.  Arşivi **Belgelerim** klasörü içinde (`Documents\WhatsappSender` vb.) bir klasöre çıkartın.
3.  **Google Chrome** tarayıcısını açın.
4.  Adres çubuğuna `chrome://extensions/` yazın ve Enter'a basın.
5.  Sağ üst köşedeki **Geliştirici Modu** (Developer Mode) anahtarını açın.
6.  Sol üstte beliren **Paketlenmemiş öğe yükle** (Load unpacked) butonuna tıklayın.
7.  Arşivi çıkarttığınız klasörü seçin.
8.  Tebrikler! Eklenti yüklendi. WhatsApp Web'i açtığınızda panel otomatik olarak belirecektir.

## 📖 Kullanım Kılavuzu

### 1. Excel Dosyası Hazırlama
Excel dosyanızın başlıkları şu formatta olmalıdır:
| Numara | Ad | Soyad | Hitap | Etiket1 |
| :--- | :--- | :--- | :--- | :--- |
| 5321234567 | Ahmet | Yılmaz | Bey | Müşteri |

### 2. Gönderim Yapma
1.  **WhatsApp Web**'i (`web.whatsapp.com`) açın.
2.  Sol panelde eklentiyi göreceksiniz.
3.  **Dosya Seç** butonundan hazırladığınız Excel dosyasını yükleyin.
4.  **Hedef Kitle** bölümünden göndermek istediğiniz etiketi seçin.
5.  **Mesaj İçeriği** kutusuna mesajınızı yazın. `{Ad}` butonlarına tıklayarak değişken ekleyebilirsiniz.
6.  **BAŞLAT** butonuna basın ve yaslanın!

### ⚙️ Ayarlar
**Gelişmiş Ayarlar** menüsü altından:
-   **Sohbet Gizliliği (Blur)**: Bu kutucuğu işaretlerseniz, sol taraftaki sohbet listesi (isimler ve mesaj önizlemeleri) bulanıklaşır. Mouse ile üzerine geldiğinizde netleşir.

## ⚠️ Uyarı
Bu yazılım sadece eğitim ve kişisel kullanım amaçlıdır. WhatsApp'ın kullanım koşullarına uymak kullanıcının sorumluluğundadır. Çok hızlı ve aşırı gönderim yapmak hesabınızın kısıtlanmasına neden olabilir. "Gönderim Hızı" ayarlarını makul seviyelerde tutunuz.

---
**Geliştirici**: Tuna
