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
    <section className="w-full mb-20">
       <h2 className='px-10 text-center py-10 text-4xl md:text-[54px] md:leading-[60px] font-bold tracking-tighter  text-golden-dark bg-clip-text mt-5'>
          How Kyve Escrow Works </h2>
     <div className="px-10 py-10 grid gap-8 md:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
           {steps.map((s, i) => (
          <div
  key={i}
  className="rounded-xl border border-gray-200 bg-white shadow-sm"
>
  <div className=" overflow-hidden rounded-xl inline-block">
    <Image
      src={s.src}
      alt={s.alt}
      width={700}      // set an intrinsic size to avoid layout shift
      height={800}     // adjust to your typical ratio
      className=" object-cover"
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
