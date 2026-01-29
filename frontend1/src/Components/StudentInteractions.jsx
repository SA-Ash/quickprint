import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const StudentInteractions = () => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInteractions();
  }, []);

  const loadInteractions = async () => {
    setLoading(true);

    const mockInteractions = [
      {
        id: 1,
        studentName: "Rahul Singh",
        college: "CBIT",
        phone: "+91 98765 43210",
        orderId: "QP-2504",
        interactionType: "new_order",
        message: "New print order received",
        timestamp: "2 minutes ago",
        status: "pending",
        orderDetails: {
          pages: 15,
          color: true,
          binding: "Spiral",
          total: "₹24.50"
        }
      },
      {
        id: 2,
        studentName: "Priya Patel",
        college: "Anurag University",
        phone: "+91 97654 32109",
        orderId: "QP-2503",
        interactionType: "status_update",
        message: "Order is ready for pickup",
        timestamp: "15 minutes ago",
        status: "ready",
        orderDetails: {
          pages: 8,
          color: false,
          binding: "Stapled",
          total: "₹18.75"
        }
      },
      {
        id: 3,
        studentName: "Aditya Sharma",
        college: "GITAM",
        phone: "+91 96543 21098",
        orderId: "QP-2502",
        interactionType: "query",
        message: "Student asked about binding options",
        timestamp: "1 hour ago",
        status: "resolved",
        orderDetails: {
          pages: 12,
          color: true,
          binding: "Hard Binding",
          total: "₹32.00"
        }
      },
      {
        id: 4,
        studentName: "Sneha Reddy",
        college: "CIN",
        phone: "+91 95432 10987",
        orderId: "QP-2501",
        interactionType: "completed",
        message: "Order completed and picked up",
        timestamp: "2 hours ago",
        status: "completed",
        orderDetails: {
          pages: 5,
          color: false,
          binding: "None",
          total: "₹15.25"
        }
      }
    ];

    setInteractions(mockInteractions);
    setLoading(false);
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'status_update':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'query':
        return <MessageCircle className="h-4 w-4 text-purple-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading interactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Student Interactions
        </h2>
      </div>

      <p className="text-gray-600 text-sm mb-4">
        Recent interactions with students from your print orders
      </p>

      <div className="space-y-3">
        {interactions.map((interaction) => (
          <div
            key={interaction.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getInteractionIcon(interaction.interactionType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {interaction.studentName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      ({interaction.college})
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {interaction.message}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Order: {interaction.orderId}</span>
                    <span>•</span>
                    <span>{interaction.timestamp}</span>
                    <span>•</span>
                    <span>{interaction.phone}</span>
                  </div>

                  {interaction.orderDetails && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Order Details:</span> {interaction.orderDetails.pages} pages,
                      {interaction.orderDetails.color ? ' Color' : ' B&W'},
                      {interaction.orderDetails.binding},
                      Total: {interaction.orderDetails.total}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 ml-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interaction.status)}`}>
                  {interaction.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {interactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">No student interactions yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Interactions will appear here when students place orders
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentInteractions;
