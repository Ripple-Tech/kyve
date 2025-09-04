import Link from "next/link"
import HeroForm from "./heroform"
import { Button } from "./ui/button"
import Image from "next/image"

const Hero = () => {
  return (
    <div className="bg-kyve-hero min-h-screen w-full flex flex-1  py-10 gap-10 flex-col lg:flex-row">
      <div className="flex flex-col md:flex-1 text-left px-10  mt-10">
        <h1 className="text-4xl md:text-5xl font-bold text-golden-dark">The Escrow Platform You Can <br/> Trust</h1>
        
     
   {/* Store buttons */}
        <div className="flex flex-col gap-4 mt-8">
          <Image
            src="/playstore.png"
            alt="Get it on Google Play"
            width={260}
            height={100}
            className="cursor-pointer"
          />
          <Image
            src="/appstore.png"
            alt="Download on the App Store"
            width={260}
            height={100}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="flex md:flex-1 py-10 px-3">
        <HeroForm />
      </div>
    </div>
  )
}

export default Hero