import Image from "next/image";
import portrait from "../../public/luca-standing-smiling-cutout.png";

type LessonPortraitProps = {
  alt: string;
  className?: string;
  preload?: boolean;
  sizes?: string;
};

export function LessonPortrait({
  alt,
  className = "",
  preload = false,
  sizes = "(max-width: 900px) 92vw, 40vw",
}: LessonPortraitProps) {
  const classes = ["lesson-portrait", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="lesson-portrait__photo">
        <Image
          src={portrait}
          alt={alt}
          fill
          preload={preload}
          className="lesson-portrait__image"
          sizes={sizes}
        />
      </div>
    </div>
  );
}
