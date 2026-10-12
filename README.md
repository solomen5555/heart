# Trái tim Lý Tuân

Hiệu ứng trái tim hạt màu hồng trên nền đen, dựng lại theo [video tham chiếu trên TikTok](https://www.tiktok.com/@tv360.vn/video/7164993670876302619).

## Chạy

Mở `index.html` bằng trình duyệt. Không cần cài thư viện hay kết nối Internet.

Hoặc chạy server local trong thư mục này:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Sau đó mở <http://127.0.0.1:8000>.

- **Space**: tạm dừng / tiếp tục.
- **F**: bật / thoát toàn màn hình, nếu trình duyệt hỗ trợ.
- Hai nút ở góc dưới bên phải có cùng chức năng.

## Chỉnh hiệu ứng

Các giá trị trong `CONFIG` ở đầu `heart.js` điều chỉnh màu hạt, số hạt và thời gian một nhịp đập (`beatSeconds`). Hàm `heartPoint()` tạo hình trái tim; `draw()` điều khiển độ co giãn và chuyển động hạt.

Canvas tự điều chỉnh theo kích thước màn hình. Nếu hệ điều hành bật chế độ giảm chuyển động, trái tim hiển thị ở trạng thái tĩnh; có thể nhấn nút tiếp tục để chạy hiệu ứng.
