import Link from "next/link"
import HeroForm from "./heroform"
import { Button } from "./ui/button"

const Hero = () => {
  return (
    <div className="bg-kyve-hero min-h-screen w-full flex flex-1  py-10 gap-10 flex-col lg:flex-row">
      <div className="flex flex-col md:flex-1 text-left px-10  mt-10">
        <h1 className="text-4xl md:text-5xl font-bold text-golden-dark">The Escrow Platform You Can <br/> Trust</h1>
        <p className="mt-4 text-lg text-foreground">Trade Safely, Kyve is your digital Shield...</p>
         <Button 
    asChild
    className="mt-8 w-fit bg-primary text-golden-dark hover:bg-primary/90 font-bold px-10 md:px-12 py-5 rounded-lg"
  >
    <Link href="/explore">Explore</Link>
  </Button>
      </div>

      <div className="flex md:flex-1 py-10 px-3">
        <HeroForm />
      </div>
    </div>
  )
}

export default Hero