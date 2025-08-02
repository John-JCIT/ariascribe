import { type Metadata } from "next";
import AboutPageContent from "./inside";

/*  
  metadata works only in server components
  that's why we have to split the page into two files
*/

export const metadata: Metadata = {
  title: "About Us | Money Printer",
  description: "Learn about our mission to help businesses grow and succeed.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
