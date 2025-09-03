import Image from "next/image";

type Step = {
  src: string;
  alt: string;
};

const steps: Step[] = [
  { src: "/phase1.jpg", alt: "Phase One Mutual Decision" },
  { src: "/phase2.jpg", alt: "Phase Two Payment Submission" },
  { src: "/phase3.jpg", alt: "Phase Three Product Delivery" },
  { src: "/phase4.jpg", alt: "Phase Four Goods Received Approval" },
  { src: "/phase5.jpg", alt: "Phase Five Payment Release" },
];

export default function HomeBenefit() {
  return (
    <section className="w-full">
       <h2 className='px-10 text-center text-4xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter  text-golden-dark bg-clip-text mt-5'>
          How Kyve Escrow Works </h2>
      <div className="flex px-10 py-10 flex-col gap-4 md:grid md:grid-cols-5 md:gap-6">
        {steps.map((s, i) => (
          <div
  key={i}
  className="rounded-xl border border-gray-200 bg-white shadow-sm"
>
  <div className="relative w-full overflow-hidden rounded-xl">
    <Image
      src={s.src}
      alt={s.alt}
      width={800}      // set an intrinsic size to avoid layout shift
      height={600}     // adjust to your typical ratio
      className="h-full w-full object-cover"
      sizes="(max-width: 768px) 100vw, 20vw"
      priority={i === 0}
    />
  </div>
</div>
        ))}
      </div>
    </section>
  );
}
