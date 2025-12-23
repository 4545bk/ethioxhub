export default function Success() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-700 to-teal-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full text-center transform transition-all hover:scale-105 duration-300">
          <h1 className="text-3xl font-bold text-teal-900 mb-4">Welcome Aboard!</h1>
          <p className="text-gray-700 text-sm mb-6">
            Congratulations! Your profile has been successfully submitted and is now under review. 
            Once approved, you’ll be visible in our Lina Agency.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://t.me/linumar"
              className="inline-block py-2 px-6 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition duration-300 text-sm"
            >
              Talk to Lina
            </a>
            <a
              href="/register"
              className="inline-block py-2 px-6 bg-gray-200 text-teal-900 rounded-lg font-semibold hover:bg-gray-300 transition duration-300 text-sm"
            >
              Register Another
            </a>
          </div>
        </div>
      </div>
    );
  }