import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <div className={styles["footer"]}>
      <div className={styles["sub-footer"]}>
        <p className={styles["webname"]}>BlogSpot</p>
        <p className={styles["copyright"]}>
          Share your thoughts, inspire the world
        </p>
      </div>
    </div>
  );
};

export default Footer;
