import serial
import time
import os
import redis
import json

#configuring the serial configurations

# ser = serial.Serial()
# # ser.port = "COM2"  #for testing from windows
# ser.port = "/dev/ttyUSB0"
# ser.baudrate = 9600
# ser.bytesize = serial.EIGHTBITS #number of bits per bytes
# ser.parity = serial.PARITY_NONE #set parity check: no parity
# ser.stopbits = serial.STOPBITS_ONE #number of stop bits
# ser.timeout = None          #block read
# ser.timeout = 10           #non-block read
# ser.xonxoff = False     #disable software flow control
# ser.rtscts = False     #disable hardware (RTS/CTS) flow control
# ser.dsrdtr = False       #disable hardware (DSR/DTR) flow control
# ser.writeTimeout = 2     #timeout for write


def HexToByte(hexStr):
	bytes=[]
	hexStr = ''.join( hexStr.split(" ") )
	for i in range(0, len(hexStr), 2):
		bytes.append( chr( int (hexStr[i:i+2], 16 ) ) )
	return ''.join( bytes )

#HexToByte("AA 55 03 01 11 14")
def writeHexToSerialAndGetResponse(command):
	ser = serial.Serial()
	# ser.port = "COM2"  #for testing from windows
	ser.port = "/dev/ttyUSB0"
	ser.baudrate = 9600
	ser.bytesize = serial.EIGHTBITS #number of bits per bytes
	ser.parity = serial.PARITY_NONE #set parity check: no parity
	ser.stopbits = serial.STOPBITS_ONE #number of stop bits
	ser.timeout = None          #block read
	# ser.timeout = 10           #non-block read
	ser.xonxoff = False     #disable software flow control
	ser.rtscts = False     #disable hardware (RTS/CTS) flow control
	ser.dsrdtr = False       #disable hardware (DSR/DTR) flow control
	ser.writeTimeout = 2     #timeout for write

	responseList = []
	try: 
		ser.open()
	except Exception, e:
		print "error open serial port: " + str(e)
		exit()

	if ser.isOpen():
		try:
			ser.write(HexToByte(command))
			print "sent {}".format(command)
			response = ser.read(6)
			# print ord(response)
			if response:
				for value in response:
					responseList.append(str(hex(ord(value))))
					# print hex(ord(value))
					# print value.strip().decode("hex")
			for x in range(len(responseList)):
   		 		print responseList[x],
			ser.close()
		except Exception, e1:
			print "error communicating...: " + str(e1)
	else:
		print "cannot open serial port "
	
	return responseList

def dispense():
    try:
        #threading.Timer(2.0, dispense).start()
        conn = redis.StrictRedis(host='localhost', port=6379)
        print(conn)
        conn.ping()
        print('Connected!')
        while True:
            Temp = conn.lrange("svm_dispenser_queue", 0, -1)
            #print(Temp)
            if Temp:
                #print(len(Temp))
                for y in range(len(Temp)):
                    itemDetails = json.loads(Temp[y])
                    #print("Data :"+ itemDetails)
                    status = str(itemDetails['status'])
                    if status == 'dispensing':
                       # if (checkErrorStatus(4)==True):
                       #     print("Error::E01 Error")
                       # if (checkErrorStatus(17)==True):
                       #     print("Error::E17 Error")
					   
					   #     quantity=quantity-1
                       
                        item = int(itemDetails['subitem_id'])
                        quantity = int(itemDetails['quantity'])
                        print("Inside dispensing", item)
                        print("Inside dispensing qty", quantity)
                        #flag = Send_to_dispenser(item, quantity) #To be uncommented in Production
                        flag = True # To be Commented in Production
                        if flag:
                            itemDetails['status'] = 'delivered'
                            conn.lset("svm_dispenser_queue", y, json.dumps(
                                itemDetails, ensure_ascii=False))
                        else:
                            itemDetails['status'] = 'Error'
                            conn.lset("svm_dispenser_queue", y, json.dumps(
                                itemDetails, ensure_ascii=False))
            #time.sleep(2)
        del conn
    except Exception as ex:
        print('Error:', ex)
        exit('Failed to connect, terminating.')


def Get_Item_Details():
    ItemDetails = []
    item1 = {"itemid": "1", "pinno": "A1", "name": "Chips1"}
    ItemDetails.append(item1)
    item2 = {"itemid": "2", "pinno": "A2", "name": "Chips2"}
    ItemDetails.append(item2)
    item3 = {"itemid": "3", "pinno": "A3" , "name": "Chips3"}
    ItemDetails.append(item3)
    item4 = {"itemid": "4", "pinno": "A4", "name": "Chips4"}
    ItemDetails.append(item4)
    item5 = {"itemid": "5", "pinno": "A5", "name": "Chips5"}
    ItemDetails.append(item5)
    item6 = {"itemid": "6", "pinno": "B1", "name": "Chips6"}
    ItemDetails.append(item6)
    item7 = {"itemid": "7", "pinno": "B2", "name": "Chips7"}
    ItemDetails.append(item7)
    item8 = {"itemid": "8", "pinno": "B3", "name": "Chips8"}
    ItemDetails.append(item8)
    item9 = {"itemid": "9", "pinno": "B4", "name": "Chips9"}
    ItemDetails.append(item9)
    item10 = {"itemid": "10", "pinno": "B5", "name": "Chips10"}
    ItemDetails.append(item10)
    item11 = {"itemid": "11", "pinno": "C1" , "name": "Biscuits1"}
    ItemDetails.append(item11)
    item12 = {"itemid": "12", "pinno": "C2", "name": "Biscuits2"}
    ItemDetails.append(item12)
    item13 = {"itemid": "13", "pinno": "C3", "name": "Bicuits3"}
    ItemDetails.append(item13)
    item14 = {"itemid": "14", "pinno": "C4", "name": "Biscuits4"}
    ItemDetails.append(item14)
    item15 = {"itemid": "15", "pinno": "C5", "name": "Biscuits5"}
    ItemDetails.append(item15)
    item16 = {"itemid": "16", "pinno": "D1", "name": "Chocolates1"}
    ItemDetails.append(item16)
    item17 = {"itemid": "17", "pinno": "D2", "name": "Chocolates2"}
    ItemDetails.append(item17)
    item18 = {"itemid": "18", "pinno": "D3" , "name": "Chocolates3"}
    ItemDetails.append(item18)
    item19 = {"itemid": "19", "pinno": "D4", "name": "Maggi1"}
    ItemDetails.append(item19)
    item20 = {"itemid": "20", "pinno": "D5", "name": "Maggi2"}
    ItemDetails.append(item20)
    item21 = {"itemid": "21", "pinno": "D6", "name": "Maggi3"}
    ItemDetails.append(item21)
    item22 = {"itemid": "22", "pinno": "E1", "name": "Tetrapack1"}
    ItemDetails.append(item22)
    item23 = {"itemid": "23", "pinno": "E2", "name": "Tetrapack2"}
    ItemDetails.append(item23)
    item24 = {"itemid": "24", "pinno": "E3", "name": "Tetrapack3"}
    ItemDetails.append(item24)
    item25 = {"itemid": "25", "pinno": "E4", "name": "Tetrapack4"}
    ItemDetails.append(item25)
    item26 = {"itemid": "26", "pinno": "E5" , "name": "Tetrapack5"}
    ItemDetails.append(item26)
    item27 = {"itemid": "27", "pinno": "E6", "name": "Tetrapack6"}
    ItemDetails.append(item27)
    item28 = {"itemid": "28", "pinno": "F1", "name": "Pet Bottle1"}
    ItemDetails.append(item28)
    item29 = {"itemid": "29", "pinno": "F2", "name": "Pet Bottle2"}
    ItemDetails.append(item29)
    item30 = {"itemid": "30", "pinno": "F3", "name": "Pet Bottle3"}
    ItemDetails.append(item30)
    item31 = {"itemid": "31", "pinno": "F4", "name": "Pet Bottle4"}
    ItemDetails.append(item31)
	
    return ItemDetails


def Send_to_dispenser(item, quantity):
    ItemhardwareDetails = Get_Item_Details()
    print(ItemhardwareDetails)
    ItemhardwareInfo = None
    for x in ItemhardwareDetails:
        if(item == int(x["itemid"])):
            ItemhardwareInfo = x
    flag = False
    if ItemhardwareInfo:
        PinNo = ItemhardwareInfo["pinno"]
        ItemName = ItemhardwareInfo["name"]
        print(PinNo)
        print(ItemName)
        for quantity in range(1, quantity+1):
				snack_dispense=writeHexToSerialAndGetResponse(PinNo)
				print(ItemName + " Dispensing Started")
				errorFlag=checkErrorStatus(coffee_dispense)
				if errorFlag:
					print(ItemName + " Dispensing Not Done !!!!")
					flag=False
				else:
					print(ItemName + " ********* Dispensing Done ********")
					quantity = quantity-1
					flag = True
					time.sleep(45)
    else:
        print("invalid Snacks")

    return flag


def checkErrorStatus(Snack_Dispense):      
    if Coffee_Dispense=='FC': 
		print "System Busy"
		state=True
    elif Coffee_Dispense=='FD':
		print "System error"
		state=True
    elif Coffee_Dispense=='99':
		print "Machine ready and dispensing"
		state=False	
    else:
		print "Machine error"
		state=True
    return state


if __name__ == "__main__":
    dispense()

    
