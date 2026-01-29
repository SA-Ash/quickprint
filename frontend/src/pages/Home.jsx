import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Printer,
  Upload,
  Settings,
  Clock,
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  IndianRupee,
  Mail,
  Phone,
  MapPin,
  Code,
} from "lucide-react";
import ExampleUsage from "../components/ExampleUsage.jsx";

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/Login");
  };

  const handleLearnMore = () => {
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });
  };

  const handleTestAPI = () => {
    document.getElementById("api-test").scrollIntoView({ behavior: "smooth" });
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-b from-blue-100 to-white min-h-max flex flex-col items-center justify-center px-4 py-16 md:py-20 lg:py-28">
        <motion.div
          className="flex flex-col items-center justify-center space-y-6 md:space-y-8 max-w-6xl text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            className="flex items-center justify-center mb-4 md:mb-6 gap-3 md:gap-4"
            variants={fadeInUp}
          >
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Printer
                size={40}
                className="sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-blue-700"
              />
            </motion.div>
            <motion.h1
              className="text-black font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-2 md:mb-4"
              variants={slideInRight}
            >
              Quick<span className="text-blue-600">Print</span>
            </motion.h1>
          </motion.div>

          <motion.h1
            className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl max-w-4xl leading-tight mb-4 md:mb-6"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
          >
            Your Campus <span className="text-blue-600">Printing</span> Solution
          </motion.h1>

          <motion.p
            className="max-w-2xl text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed mb-6 md:mb-8"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
          >
            Connect students with local print shops for fast, affordable, and
            convenient printing services. Upload your documents online and pick
            them up at your campus!
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 md:mb-12"
            variants={fadeInUp}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={handleGetStarted}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 text-white px-6 py-3 sm:px-7 sm:py-3 md:px-8 md:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-blue-700 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </motion.button>

            <motion.button
              onClick={handleLearnMore}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-blue-600 text-blue-600 px-6 py-3 sm:px-7 sm:py-3 md:px-8 md:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center justify-center"
            >
              Learn More
            </motion.button>

            <motion.button
              onClick={handleTestAPI}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-green-600 text-green-600 px-6 py-3 sm:px-7 sm:py-3 md:px-8 md:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-green-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Code size={18} />
              Test API
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      <div id="features" className="py-16 md:py-20 lg:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-8 md:mb-10 lg:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
              Why Choose QuickPrint?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              We've revolutionized campus printing with our platform that
              connects students with trusted local print shops.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {[
              {
                icon: Clock,
                title: "24/7 Availability",
                desc: "Upload and order prints anytime, anywhere. We're always ready to serve you.",
              },
              {
                icon: Upload,
                title: "Easy Online Ordering",
                desc: "Simple, intuitive platform to upload documents and customize your print options.",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                desc: "Multiple payment options with secure, encrypted transactions.",
              },
              {
                icon: IndianRupee,
                title: "Fair Pricing",
                desc: "Transparent and student-friendly prices. Pay only for what you print.",
              },
              {
                icon: CheckCircle,
                title: "Quality Guaranteed",
                desc: "Professional printing quality with satisfaction guarantee.",
              },
              {
                icon: Star,
                title: "Skip the Queue",
                desc: "No more long lines at print shops – order online and collect hassle-free.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white p-4 sm:p-5 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <motion.div
                  className="bg-blue-100 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-3 md:mb-4 text-blue-600"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.icon
                    size={24}
                    className="sm:w-6 sm:h-6 md:w-7 md:h-7"
                  />
                </motion.div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="py-16 md:py-20 lg:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10 md:mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Getting your documents printed is as easy as 1-2-3
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col md:flex-row justify-around items-start gap-8 md:gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {[
              {
                number: "1",
                title: "Upload Your Document",
                desc: "Simply upload your PDF, Word doc, or any printable file to our secure platform.",
                icon: Upload,
              },
              {
                number: "2",
                title: "Choose Your Options",
                desc: "Select print settings, binding options, and your preferred pickup location.",
                icon: Settings,
              },
              {
                number: "3",
                title: "Pick Up & Pay",
                desc: "Get notified when ready, then pick up your perfectly printed documents.",
                icon: CheckCircle,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center text-center max-w-xs mx-auto mb-8 md:mb-0"
              >
                <motion.div
                  className="text-3xl sm:text-4xl font-bold text-blue-600 mb-3 md:mb-4"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  {step.number}
                </motion.div>
                <motion.div
                  className="bg-blue-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 md:mb-6 text-blue-600"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <step.icon
                    size={26}
                    className="sm:w-7 sm:h-7 md:w-8 md:h-8"
                  />
                </motion.div>
                <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div id="api-test" className="py-16 md:py-20 lg:py-28 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-8 md:mb-10 lg:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
              API Integration Test
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Test the backend API integration with real endpoints. Make sure the backend is running on port 4000.
            </p>
          </motion.div>
          <ExampleUsage />
        </div>
      </div>

      <motion.div
        className="py-16 md:py-20 lg:py-28 px-4 bg-blue-600"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          <motion.h2
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4"
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            className="mb-6 md:mb-8 max-w-2xl mx-auto text-sm md:text-base"
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join thousands of students who are already using QuickPrint for
            their printing needs.
          </motion.p>
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white text-blue-600 px-6 py-3 sm:px-7 sm:py-3 md:px-8 md:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-gray-100 transition-all duration-200 shadow-md"
          >
            Start Printing Today
          </motion.button>
        </div>
      </motion.div>

      <motion.footer
        className="bg-gray-800 text-white py-12 md:py-16 lg:py-20 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              variants={fadeInUp}
              className="sm:col-span-2 md:col-span-1"
            >
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <motion.div
                  className="bg-blue-500 p-1.5 rounded"
                  whileHover={{ rotate: 5 }}
                >
                  <Printer size={16} className="sm:w-4 sm:h-4 text-white" />
                </motion.div>
                <h3 className="text-base md:text-lg font-bold">QuickPrint</h3>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm md:text-sm">
                Making campus printing simple, fast, and affordable for students
                across Hyderabad.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">
                Services
              </h4>
              <ul className="space-y-1 md:space-y-2 text-gray-300 text-xs sm:text-sm">
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Document Printing
                </motion.li>
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Binding Services
                </motion.li>
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Color Printing
                </motion.li>
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Express Delivery
                </motion.li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">
                Support
              </h4>
              <ul className="space-y-1 md:space-y-2 text-gray-300 text-xs sm:text-sm">
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Help Center
                </motion.li>
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Contact Us
                </motion.li>
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Track Order
                </motion.li>
                <motion.li
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Partner With Us
                </motion.li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">
                Contact
              </h4>
              <ul className="space-y-1 md:space-y-2 text-gray-300 text-xs sm:text-sm">
                <motion.li
                  className="flex items-center gap-2"
                  whileHover={{ x: 5 }}
                >
                  <Mail
                    size={12}
                    className="sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-300"
                  />
                  t.sharath258@gmail.com
                </motion.li>
                <motion.li
                  className="flex items-center gap-2"
                  whileHover={{ x: 5 }}
                >
                  <Phone
                    size={12}
                    className="sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-300"
                  />
                  +91 93983 93986
                </motion.li>
                <motion.li
                  className="flex items-center gap-2"
                  whileHover={{ x: 5 }}
                >
                  <MapPin
                    size={12}
                    className="sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-300"
                  />
                  Hyderabad, Telangana
                </motion.li>
              </ul>
            </motion.div>
          </motion.div>

          <motion.div
            className="border-t border-gray-700 pt-4 md:pt-6 text-center text-gray-400 text-xs sm:text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p>© 2025 QuickPrint. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Home;
