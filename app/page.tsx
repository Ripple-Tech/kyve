import Features from "@/components/Features";
import Hero from "@/components/Hero";
import HomeBenefit from "@/components/HomeBenefit";
import Testimonial from "@/components/Testimonial";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Hero />
      <HomeBenefit/>
      <Features/>
      <Testimonial/>
    </div>
  );
}
