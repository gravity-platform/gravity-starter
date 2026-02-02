import React from "react";
import styles from "./Card.module.css";
import Button from "../../atoms/Button/Button";

interface CardProps {
  title?: string;
  description?: string;
  image?: string;
  callToAction?: string;
  object?: Record<string, any>;
  onClick?: (data: any) => void;
}

export default function Card(props: CardProps) {
  const obj: any = props.object ?? {};

  // Use explicit empty string check - || treats "" as falsy, so we need to check for actual content
  const title = (props.title && props.title.trim()) || obj.title;
  const description = (props.description && props.description.trim()) || obj.description;
  const image =
    (props.image && props.image.trim()) ||
    obj.image ||
    obj.metadata?.images?.[0] ||
    (obj.source_url?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ? obj.source_url : undefined);
  const callToAction =
    (props.callToAction && props.callToAction.trim()) || obj.callToAction || obj.metadata?.callToAction;

  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: { type: "click", data: { object: obj }, componentId: "Card" },
      }),
    );
  };

  return (
    <div className={styles.card}>
      {image && (
        <div className={styles.imageContainer}>
          <img src={image} alt={title} className={styles.image} />
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {callToAction && <Button onClick={handleClick}>{callToAction}</Button>}
      </div>
    </div>
  );
}
