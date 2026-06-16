import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import styles from "./HeroCarousel.module.scss";

const slides = [
  {
    id: 1,
    title: "Kết nối cộng đồng yêu sách",
    img: "/images/hero/image1.png",
    items: [
      "Kết nối người đọc và cộng đồng yêu sách trên cùng một nền tảng.",
      "Chia sẻ một cuốn sách – lan tỏa ngàn giá trị tri thức.",
      "Xây dựng cộng đồng học tập và phát triển lâu dài.",
      "Tạo môi trường kết nối nhân văn dựa trên lòng tốt và sẻ chia."
    ]
  },
  {
    id: 2,
    title: "Tiếp cận tri thức tiết kiệm & chất lượng",
    img: "/images/hero/image2.png",
    items: [
      "Tối ưu chi phí tiếp cận tri thức cho sinh viên và người trẻ.",
      "Tiết kiệm chi phí nhưng vẫn tiếp cận nguồn kiến thức chất lượng.",
      "Mỗi cuốn sách được trao đổi là một cơ hội học tập mới.",
      "Giảm áp lực tài chính khi mua sách mới – đọc nhiều hơn, trả ít hơn."
    ]
  },
  {
    id: 3,
    title: "Văn hóa đọc và phát triển bền vững",
    img: "/images/hero/image3.png",
    items: [
      "Thúc đẩy văn hóa đọc trong thời đại công nghệ số.",
      "Góp phần xây dựng văn hóa đọc bền vững trong cộng đồng.",
      "Tái sử dụng tài nguyên và bảo vệ môi trường.",
      "Giảm thiểu rác thải giấy – hướng đến tiêu dùng bền vững."
    ]
  },
  {
    id: 4,
    title: "Kinh tế tuần hoàn & hệ sinh thái tri thức mở",
    img: "/images/hero/image4.png",
    items: [
      "Chia sẻ kiến thức thông qua mô hình kinh tế tuần hoàn.",
      "Cùng nhau tạo nên một hệ sinh thái tri thức mở cho mọi người.",
      "Kéo dài vòng đời của sách – giảm lãng phí tài nguyên.",
      "Lan tỏa tri thức không giới hạn – từ một cuốn sách đến hàng ngàn người."
    ]
  }
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className={styles.heroWrapper}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={styles.slideBackground}
          style={{ backgroundImage: `url(${slides[currentIndex].img})` }}
        >
          <div className={styles.overlay}>
            <div className={styles.contentContainer}>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className={styles.title}
              >
                {slides[currentIndex].title}
              </motion.h1>

              <div className={styles.listContainer}>
                {slides[currentIndex].items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                    className={styles.listItem}
                  >
                    <Check size={28} className={styles.checkIcon} />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className={styles.navigation}>
        <button onClick={handlePrev} className={styles.navButton}>
          <ChevronLeft size={16} />
        </button>
        <div className={styles.dots}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ""}`}
            />
          ))}
        </div>
        <button onClick={handleNext} className={styles.navButton}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
